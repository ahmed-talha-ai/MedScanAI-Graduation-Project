import os
import json
import logging
import time
from contextlib import asynccontextmanager
from typing import Dict, Any, Tuple
from io import BytesIO
from enum import Enum
import re

import cv2
import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image

from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, status, Query
from fastapi.responses import StreamingResponse
from stream_utils import make_metadata_event, make_text_event, make_done_event, sanitize_chunk
from fastapi.middleware.cors import CORSMiddleware
from torchvision import transforms
from transformers import ViTForImageClassification
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
    "Acne and Rosacea Photos": "حب الشباب والوردية (Acne/Rosacea)",
    "Actinic Keratosis Basal Cell Carcinoma and other Malignant Lesions": "التقرن السفعي وسرطان الخلايا القاعدية",
    "Atopic Dermatitis Photos": "التهاب الجلد التأتبي (Atopic Dermatitis)",
    "Bullous Disease Photos": "الأمراض الفقاعية (Bullous Disease)",
    "Cellulitis Impetigo and other Bacterial Infections": "التهاب النسيج الخلوي والعدوى البكتيرية",
    "Eczema Photos": "الأكزيما (Eczema)",
    "Exanthems and Drug Eruptions": "الطفح الجلدي والتفاعلات الدوائية",
    "Hair Loss Photos Alopecia and other Hair Diseases": "تساقط الشعر والثعلبة",
    "Herpes HPV and other STDs Photos": "الهربس والأمراض المنقولة جنسياً",
    "Light Diseases and Disorders of Pigmentation": "أمراض التصبغ والحساسية الضوئية",
    "Lupus and other Connective Tissue diseases": "الذئبة وأمراض الأنسجة الضامة",
    "Melanoma Skin Cancer Nevi and Moles": "سرطان الجلد (ميلانوما) والشامات",
    "Nail Fungus and other Nail Disease": "فطريات وأمراض الأظافر",
    "Poison Ivy Photos and other Contact Dermatitis": "التهاب الجلد التماسي (مثل اللبلاب السام)",
    "Psoriasis pictures Lichen Planus and related diseases": "الصدفية والحزاز المسطح",
    "Scabies Lyme Disease and other Infestations and Bites": "الجرب ولتغات الحشرات",
    "Seborrheic Keratoses and other Benign Tumors": "التقرن الدهني والأورام الحميدة",
    "Systemic Disease": "الأمراض الجهازية الجلدية",
    "Tinea Ringworm Candidiasis and other Fungal Infections": "التينيا والقوباء الحلقية (عدوى فطرية)",
    "Urticaria Hives": "الشرى (الأرتيكاريا/الحساسية)",
    "Vascular Tumors": "الأورام الوعائية",
    "Vasculitis Photos": "التهاب الأوعية الدموية",
    "Warts Molluscum and other Viral Infections": "الثآليل (السنط) والعدوى الفيروسية"
}

# ===============================================================
# 2. CONFIGURATION
# ===============================================================
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("DermNetAPI")

class Settings(BaseSettings):
    APP_NAME: str = "DermNet AI (Egyptian Arabic)"
    VERSION: str = "2.3.0"
    HF_TOKEN: str
    LLM_REPO_ID: str = "deepseek-ai/DeepSeek-R1"  # Best for Arabic support
    
    # Best Model Paths
    MODEL_16_PATH: str = "models/best_vit_dermnet_balanced_16.pth"
    LABELS_16_PATH: str = "models/label_mapping_balanced_16.json"
    MODEL_7_PATH: str = "models/best_vit_dermnet_balanced_7.pth"
    LABELS_7_PATH: str = "models/label_mapping_balanced_7.json"
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ===============================================================
# 3. DATA SCHEMAS
# ===============================================================
class PredictionResponse(BaseModel):
    class_label_en: str = Field(..., description="English Disease Name")
    class_label_ar: str = Field(..., description="Arabic Disease Name")
    confidence_level: str = Field(..., description="Confidence score percentage (e.g. 95.50%)") 
    generated_advice: str = Field(..., description="Medical advice in Egyptian Arabic")

class ErrorResponse(BaseModel):
    detail: str

# ===============================================================
# 4. PREPROCESSING
# ===============================================================
class ImagePreprocessor:
    def __init__(self):
        # Setup transformation pipeline with CLAHE
        self.transform = transforms.Compose([
            self._apply_clahe,
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

    @staticmethod
    def _apply_clahe(img: Image.Image) -> Image.Image:
        """Apply Contrast Limited Adaptive Histogram Equalization"""
        img_np = np.array(img)
        # Handle Grayscale images
        if img_np.ndim == 2: img_np = cv2.cvtColor(img_np, cv2.COLOR_GRAY2RGB)
        
        img_cv = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
        lab = cv2.cvtColor(img_cv, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        cl = clahe.apply(l)
        limg = cv2.merge((cl, a, b))
        final = cv2.cvtColor(limg, cv2.COLOR_LAB2RGB)
        return Image.fromarray(final)

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
        self.models: Dict[str, Any] = {}
        self.labels: Dict[str, list] = {}
        self.preprocessor = ImagePreprocessor()

    def load_resources(self):
        logger.info("🚀 Loading AI Models...")
        try:
            self._load_single_model("16", settings.MODEL_16_PATH, settings.LABELS_16_PATH)
            self._load_single_model("7", settings.MODEL_7_PATH, settings.LABELS_7_PATH)
            logger.info("✅ Models Loaded.")
        except Exception as e:
            logger.critical(f"🔥 Failed to load models: {e}")
            raise RuntimeError("Model loading failed")

    def _load_single_model(self, key: str, model_path: str, label_path: str):
        with open(label_path, 'r') as f: self.labels[key] = json.load(f)
        
        model = ViTForImageClassification.from_pretrained(
            "google/vit-base-patch16-224", 
            num_labels=len(self.labels[key]), 
            ignore_mismatched_sizes=True
        )
        
        # Load weights with security check disabled for safe local files
        ckpt = torch.load(model_path, map_location=device, weights_only=False)
        state_dict = ckpt['model_state_dict'] if 'model_state_dict' in ckpt else ckpt
        model.load_state_dict(state_dict)
        model.to(device).eval()
        self.models[key] = model

    def predict(self, image_tensor: torch.Tensor) -> Tuple[str, float]:
        with torch.no_grad():
            # Prediction from Model 16
            l16 = self.models['16'](image_tensor).logits
            p16 = F.softmax(l16, dim=1)
            c16, i16 = torch.max(p16, dim=1)

            # Prediction from Model 7
            l7 = self.models['7'](image_tensor).logits
            p7 = F.softmax(l7, dim=1)
            c7, i7 = torch.max(p7, dim=1)

        conf16, conf7 = c16.item(), c7.item()
        logger.info(f"Scores -> M16: {conf16:.2f} | M7: {conf7:.2f}")

        # Ensemble Logic: Winner Takes All
        if conf7 > conf16:
            return self.labels['7'][i7.item()], conf7
        else:
            return self.labels['16'][i16.item()], conf16

# ===============================================================
# 6. ADVICE SERVICE (EGYPTIAN ARABIC LLM)
# ===============================================================
class AdviceService:
    def __init__(self):
        self.client = InferenceClient(
            token=settings.HF_TOKEN,
            base_url="https://router.huggingface.co"
        )
        self.model_id = settings.LLM_REPO_ID

    def _get_hardcoded_response(self, disease_en: str, confidence: float, confidence_pct: str, user_role: UserRole):
        if confidence < 0.55:
            if user_role in (UserRole.doctor, UserRole.Doctor):
                return "Confidence level is low. A direct clinical examination is recommended along with additional diagnostic tests (e.g., skin biopsy, dermoscopy) to confirm the diagnosis."
            return "النتيجة مش مؤكدة أوي يا فندم. الأفضل تروح لدكتور جلدية عشان يفحصك بنفسه ويطمنك."
        return None

    def _get_error_fallback(self, disease_en: str, disease_ar: str, user_role: UserRole) -> str:
        if user_role in (UserRole.doctor, UserRole.Doctor):
            return f"An error occurred generating the clinical report. Please refer to specialized dermatology references for: {disease_en}."
        return f"معلش حصل مشكلة صغيرة، بس بننصحك تروح لدكتور جلدية فوراً عشان تطمن على نتيجة {disease_ar}."

    def _build_messages(self, disease_en: str, disease_ar: str, confidence_pct: str, user_role: UserRole):
        if user_role in (UserRole.doctor, UserRole.Doctor):
            return [
                {
                    "role": "system",
                    "content": """You are a dermatology assistant providing organized clinical summaries to physicians. Use proper medical terminology and format with clear section headers."""
                },
                {
                    "role": "user",
                    "content": f"""
                    Condition: "{disease_en}"
                    
                    Provide an ORGANIZED clinical report with the following format:
                    
                    **AI Diagnostic Confidence:** {confidence_pct}
                    
                    **1. Clinical Description & Etiology:**
                    [Describe key features, pathophysiology, and common causative agents]
                    
                    **2. Differential Diagnosis:**
                    - [First differential]
                    - [Second differential]
                    
                    **3. Treatment Options:**
                    - Topical: [options]
                    - Systemic: [options]
                    - Procedures: [if applicable]
                    
                    **4. Recommended Investigations:**
                    [Key tests to confirm diagnosis]
                    
                    **5. Clinical Note:**
                    [Important considerations and when to refer]
                    
                    Keep response around 200-250 words. Final decision rests with treating physician.
                    """
                }
            ]
        else:
            return [
                {
                    "role": "system",
                    "content": """أنت مساعد طبي ودود. بتتكلم باللهجة المصرية العامية. نظم ردك بعناوين واضحة. متوصفش أدوية."""
                },
                {
                    "role": "user",
                    "content": f"""
                    المريض عنده: "{disease_ar}" ({disease_en}).
                    
                    اكتب رد منظم بالشكل ده:
                    
                    **نسبة ثقة التشخيص:** {confidence_pct}
                    
                    **إيه هي الحالة دي؟**
                    [شرح بسيط ومفهوم]
                    
                    **نصائح للعناية في البيت:**
                    - [نصيحة 1]
                    - [نصيحة 2]
                    - [نصيحة 3]
                    
                    **علامات الخطر - روح للدكتور فوراً لو:**
                    [علامة خطر واحدة أو اتنين]
                    
                    **الدكتور المناسب:**
                    [التخصص المناسب ليه]
                    
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
            logger.error(f"DeepSeek Error: {e}")
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
async def predict_skin_disease(
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
        # Fallback to English name if not found in Arabic map
        label_ar = ARABIC_DISEASE_NAMES.get(label_en, label_en) 

        # 4. Generate Role-Based Advice
        # Doctor: Clinical terminology and treatment options
        # Patient: Simple advice with specialist recommendation
        advice_ar = advice_service.generate_advice(label_en, label_ar, confidence, user_role)
        logger.info(f"Generated advice for role: {user_role.value}")

        return {
            "class_label_en": label_en,
            "class_label_ar": label_ar,
            "confidence_level": f"{confidence * 100:.2f}%", # Formatted as Percentage
            "generated_advice": advice_ar
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
            model="dermnet",
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

# To run: uvicorn main:app --reload --host 0.0.0.0 --port 8000
# http://localhost:8000/docs