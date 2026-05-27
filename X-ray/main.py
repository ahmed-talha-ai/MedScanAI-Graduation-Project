import os
import json
import logging
from contextlib import asynccontextmanager
from typing import Dict, Any, Tuple
from io import BytesIO
from enum import Enum
import re

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from PIL import Image
from torchvision import transforms, models

from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.responses import StreamingResponse
from stream_utils import make_metadata_event, make_text_event, make_done_event, sanitize_chunk
from fastapi.middleware.cors import CORSMiddleware
from huggingface_hub import InferenceClient
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings

# ===============================================================
# USER ROLE ENUM
# ===============================================================
class UserRole(str, Enum):
    doctor = "doctor"
    patient = "patient"
    Doctor = "Doctor"
    Patient = "Patient"

# ===============================================================
# 1. ARABIC TRANSLATION MAP (Disease Names)
# ===============================================================
ARABIC_DISEASE_NAMES = {
    "COVID": "كوفيد-19 (COVID-19)",
    "Normal": "طبيعي (لا يوجد مرض)",
    "Viral Pneumonia": "التهاب رئوي فيروسي",
    "Lung_Opacity": "عتامة رئوية (Lung Opacity)"
}

# Class names in order
CLASS_NAMES = ["COVID", "Normal", "Viral Pneumonia", "Lung_Opacity"]

# ===============================================================
# 2. CONFIGURATION
# ===============================================================
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("XRayAPI")

class Settings(BaseSettings):
    APP_NAME: str = "X-Ray AI (Egyptian Arabic)"
    VERSION: str = "1.0.0"
    HF_TOKEN: str
    LLM_REPO_ID: str = "deepseek-ai/DeepSeek-R1"
    
    MODEL_PATH: str = "models/best_effv2l_optimized_v2_final.pth"
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ===============================================================
# 3. DATA SCHEMAS
# ===============================================================
class PredictionResponse(BaseModel):
    class_label_en: str = Field(..., description="English Diagnosis")
    class_label_ar: str = Field(..., description="Arabic Diagnosis")
    confidence_level: str = Field(..., description="Confidence score percentage")
    generated_advice: str = Field(..., description="Medical advice")

class ErrorResponse(BaseModel):
    detail: str

# ===============================================================
# 4. PREPROCESSING
# ===============================================================
class ImagePreprocessor:
    def __init__(self):
        # Setup transformation pipeline (same as x-ray-96.27 training — 224×224)
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

    def preprocess(self, image_bytes: bytes) -> torch.Tensor:
        try:
            image = Image.open(BytesIO(image_bytes)).convert("RGB")
            return self.transform(image).unsqueeze(0).to(device)
        except Exception as e:
            logger.error(f"Preprocessing failed: {e}")
            raise HTTPException(status_code=400, detail="Invalid image format.")

# ===============================================================
# 5. MODEL SERVICE
# ===============================================================
class ModelService:
    def __init__(self):
        self.model = None
        self.preprocessor = ImagePreprocessor()

    def load_resources(self):
        logger.info("🚀 Loading X-Ray Classification Model...")
        try:
            # Build EfficientNet V2 Large model
            self.model = models.efficientnet_v2_l(weights=None)
            
            # Modify classifier for 4 classes (must match training notebook architecture)
            in_features = self.model.classifier[1].in_features
            self.model.classifier = nn.Sequential(
                nn.Dropout(p=0.4, inplace=True),
                nn.Linear(in_features, 512),
                nn.ReLU(),
                nn.Dropout(p=0.3),
                nn.Linear(512, len(CLASS_NAMES))
            )
            
            # Load weights
            ckpt = torch.load(settings.MODEL_PATH, map_location=device, weights_only=False)
            if isinstance(ckpt, dict) and 'model_state_dict' in ckpt:
                self.model.load_state_dict(ckpt['model_state_dict'])
            else:
                self.model.load_state_dict(ckpt)
            
            self.model.to(device).eval()
            logger.info("✅ X-Ray Model Loaded Successfully.")
        except Exception as e:
            logger.critical(f"🔥 Failed to load model: {e}")
            raise RuntimeError(f"Model loading failed: {e}")

    def predict(self, image_tensor: torch.Tensor) -> Tuple[str, float]:
        with torch.no_grad():
            logits = self.model(image_tensor)
            probs = F.softmax(logits, dim=1)
            confidence, class_idx = torch.max(probs, dim=1)
        
        label_en = CLASS_NAMES[class_idx.item()]
        conf = confidence.item()
        
        logger.info(f"Prediction: {label_en} ({conf:.4f})")
        return label_en, conf

# ===============================================================
# 6. ADVICE SERVICE (Egyptian Arabic LLM)
# ===============================================================
class AdviceService:
    def __init__(self):
        self.client = InferenceClient(
            token=settings.HF_TOKEN,
            base_url="https://router.huggingface.co"
        )
        self.model_id = settings.LLM_REPO_ID

    def _get_hardcoded_response(self, disease_en: str, confidence: float, confidence_pct: str, user_role: UserRole):
        """Return hardcoded text for trivial cases, or None if LLM is needed."""
        if disease_en == "Normal":
            if user_role in (UserRole.doctor, UserRole.Doctor):
                return f"""**AI Diagnostic Confidence:** {confidence_pct}\n\n**Findings:** Chest X-ray appears within normal limits. No evidence of acute pulmonary pathology, consolidation, or significant opacification.\n\n**Recommendation:** If patient presents with persistent respiratory symptoms, consider further workup (e.g., CT chest, pulmonary function tests, or referral to pulmonology)."""
            return f"""**نسبة ثقة التشخيص:** {confidence_pct}\n\nالحمد لله يا فندم، الأشعة طبيعية ومفيش أي مشاكل واضحة في الرئة ❤️.\n\nلو لسه حاسس بأعراض زي كحة أو صعوبة تنفس، ممكن تروح لدكتور صدرية عشان يطمنك أكتر."""
        if confidence < 0.50:
            if user_role in (UserRole.doctor, UserRole.Doctor):
                return f"**AI Diagnostic Confidence:** {confidence_pct}\n\nConfidence level is low. Direct clinical examination with additional imaging (CT chest) or laboratory workup is recommended to confirm diagnosis."
            return f"**نسبة ثقة التشخيص:** {confidence_pct}\n\n⚠️ النتيجة مش مؤكدة أوي. الأفضل تروح لدكتور صدرية يفحصك بنفسه ويطلب فحوصات إضافية لو لزم الأمر."
        return None

    def _get_error_fallback(self, disease_en: str, disease_ar: str, user_role: UserRole) -> str:
        if user_role in (UserRole.doctor, UserRole.Doctor):
            return f"An error occurred generating the clinical report. Please refer to specialized pulmonology/radiology references for: {disease_en}."
        return f"نصيحة عامة: لو عندك أي أعراض تنفسية، الأفضل تروح لدكتور صدرية عشان يفحصك ويطمنك على {disease_ar}."

    def _build_messages(self, disease_en: str, disease_ar: str, confidence_pct: str, user_role: UserRole):
        if user_role in (UserRole.doctor, UserRole.Doctor):
            return [
                {
                    "role": "system",
                    "content": """You are a pulmonology/radiology assistant providing organized clinical summaries to physicians. Use proper medical terminology and format with clear section headers."""
                },
                {
                    "role": "user",
                    "content": f"""
                    Chest X-Ray Finding: "{disease_en}"
                    
                    Provide an ORGANIZED clinical report with the following format:
                    
                    **AI Diagnostic Confidence:** {confidence_pct}
                    
                    **1. Clinical Description & Etiology:**
                    [Key radiographic features, pathophysiology, and common causative agents]
                    
                    **2. Differential Diagnosis:**
                    - [First differential]
                    - [Second differential]
                    
                    **3. Treatment Options:**
                    - Pharmacological: [options]
                    - Supportive: [options]
                    - Hospitalization criteria: [if applicable]
                    
                    **4. Recommended Investigations:**
                    [Key tests to confirm diagnosis - labs, CT, etc.]
                    
                    **5. Clinical Note:**
                    [Important considerations, isolation precautions if applicable, and when to escalate care]
                    
                    Keep response around 200-250 words. Final decision rests with treating physician.
                    """
                }
            ]
        else:
            return [
                {
                    "role": "system",
                    "content": """أنت مساعد طبي ودود متخصص في أمراض الصدر والرئة. بتتكلم باللهجة المصرية العامية. نظم ردك بعناوين واضحة. متوصفش أدوية."""
                },
                {
                    "role": "user",
                    "content": f"""
                    المريض عمل أشعة صدر والنظام لقى احتمالية: "{disease_ar}" ({disease_en}).
                    
                    اكتب رد منظم بالشكل ده:
                    
                    **نسبة ثقة التشخيص:** {confidence_pct}
                    
                    **🫁 إيه هي الحالة دي؟**
                    [شرح بسيط ومفهوم بدون تخويف]
                    
                    **📝 الخطوات الجاية:**
                    - [روح لدكتور إيه]
                    - [خد معاك إيه]
                    
                    **⚠️ علامات الخطر - روح المستشفى فوراً لو:**
                    [علامة أو اتنين - زي صعوبة شديدة في التنفس]
                    
                    **💊 نصائح عامة:**
                    - [نصيحة 1]
                    - [نصيحة 2]
                    
                    **👨‍⚕️ الدكتور المناسب:**
                    [التخصص]
                    
                    خلي الرد حوالي 120-150 كلمة. ودود ومطمن. متوصفش أي أدوية.
                    """
                }
            ]

    def generate_advice(self, disease_en: str, disease_ar: str, confidence: float, user_role: UserRole = UserRole.patient) -> str:
        confidence_pct = f"{confidence * 100:.1f}%"
        hardcoded = self._get_hardcoded_response(disease_en, confidence, confidence_pct, user_role)
        if hardcoded is not None:
            return hardcoded
        messages = self._build_messages(disease_en, disease_ar, confidence_pct, user_role)
        try:
            response = self.client.chat_completion(
                model=self.model_id,
                messages=messages,
                max_tokens=800,
                temperature=0.5
            )
            response_text = response.choices[0].message.content.strip()
            response_text = re.sub(r'<think>[\s\S]*?(?:</think>|$)', '', response_text).strip()
            response_text = re.sub(r'<br\s*/?>', '\n', response_text)
            return response_text
        except Exception as e:
            logger.error(f"LLM Error: {e}")
            return self._get_error_fallback(disease_en, disease_ar, user_role)

    def generate_advice_stream(self, disease_en: str, disease_ar: str, confidence: float, user_role: UserRole = UserRole.patient):
        """Generator that yields advice tokens one at a time."""
        confidence_pct = f"{confidence * 100:.1f}%"
        hardcoded = self._get_hardcoded_response(disease_en, confidence, confidence_pct, user_role)
        if hardcoded is not None:
            for word in hardcoded.split(' '):
                yield word + ' '
            return
        messages = self._build_messages(disease_en, disease_ar, confidence_pct, user_role)
        try:
            stream = self.client.chat_completion(
                model=self.model_id,
                messages=messages,
                max_tokens=800,
                temperature=0.5,
                stream=True
            )
            in_think_block = False
            think_seen = False
            for chunk in stream:
                token = chunk.choices[0].delta.content or ""
                if not token:
                    continue
                if not think_seen:
                    if "<think>" in token:
                        in_think_block = True
                        continue
                    if in_think_block:
                        if "</think>" in token:
                            in_think_block = False
                            think_seen = True
                            after = token.split("</think>", 1)[1]
                            if after.strip():
                                yield after
                        continue
                yield token
        except Exception as e:
            logger.error(f"DeepSeek Streaming Error: {e}")
            fallback = self._get_error_fallback(disease_en, disease_ar, user_role)
            for word in fallback.split(' '):
                yield word + ' '

# ===============================================================
# 7. APP SETUP & ENDPOINTS
# ===============================================================
model_service = ModelService()
advice_service = AdviceService()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load resources on startup
    model_service.load_resources()
    yield
    # Cleanup on shutdown
    torch.cuda.empty_cache()

app = FastAPI(title=settings.APP_NAME, version=settings.VERSION, lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.post("/predict", response_model=PredictionResponse)
async def predict_chest_xray(
    file: UploadFile = File(...),
    user_role: UserRole = Query(default=UserRole.patient, description="User role: 'doctor' for clinical details or 'patient' for general advice")
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(400, detail="Invalid file type. Please upload an image.")

    try:
        # 1. Preprocess
        contents = await file.read()
        img_tensor = model_service.preprocessor.preprocess(contents)

        # 2. Predict (Get English Label)
        label_en, confidence = model_service.predict(img_tensor)
        
        # 3. Translate Label
        label_ar = ARABIC_DISEASE_NAMES.get(label_en, label_en)

        # 4. Generate Role-Based Advice
        advice = advice_service.generate_advice(label_en, label_ar, confidence, user_role)
        logger.info(f"Generated advice for role: {user_role.value}")

        return {
            "class_label_en": label_en,
            "class_label_ar": label_ar,
            "confidence_level": f"{confidence * 100:.2f}%",
            "generated_advice": advice
        }

    except Exception as e:
        logger.error(f"Error: {e}", exc_info=True)
        raise HTTPException(500, detail="An error occurred while processing the image.")


@app.post("/predict/stream")
async def predict_stream(
    file: UploadFile = File(...),
    user_role: UserRole = Query(default=UserRole.patient)
):
    """SSE streaming endpoint — returns text/event-stream."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(400, detail="Invalid file type.")

    contents = await file.read()
    img_tensor = model_service.preprocessor.preprocess(contents)
    label_en, confidence = model_service.predict(img_tensor)
    label_ar = ARABIC_DISEASE_NAMES.get(label_en, label_en)

    def event_generator():
        yield make_metadata_event(
            label=label_en,
            confidence=round(confidence, 4),
            model="xray",
            label_ar=label_ar
        )
        for token in advice_service.generate_advice_stream(label_en, label_ar, confidence, user_role):
            clean = sanitize_chunk(token)
            if clean:
                yield make_text_event(clean)
        yield make_done_event()

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        }
    )

# To run: uvicorn main:app --reload --host 0.0.0.0 --port 8002
# http://localhost:8002/docs
