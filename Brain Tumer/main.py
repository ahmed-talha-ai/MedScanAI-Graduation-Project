import os
import json
import logging
from contextlib import asynccontextmanager
from typing import Tuple
from io import BytesIO
from enum import Enum
import re

import numpy as np
from PIL import Image

# ---------------------------------------------------------------
# TensorFlow / Keras Imports
# ---------------------------------------------------------------
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout, BatchNormalization, Input
from tensorflow.keras.applications import Xception
from tensorflow.keras.preprocessing import image as tf_image

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
# 1. MAPPING CONFIGURATION
# ===============================================================
CLASS_NAMES_LIST = ['glioma', 'meningioma', 'notumor', 'pituitary']

ARABIC_DISEASE_NAMES = {
    "glioma": "ورم دبقي (Glioma)",
    "meningioma": "ورم سحائي (Meningioma)",
    "notumor": "لا يوجد ورم (No Tumor)",
    "pituitary": "ورم الغدة النخامية (Pituitary Tumor)"
}

# ===============================================================
# 2. CONFIGURATION & SETTINGS
# ===============================================================
logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("BrainTumorAPI")


class Settings(BaseSettings):
    APP_NAME: str = "Brain Tumor AI (Egyptian Arabic)"
    VERSION: str = "4.1.0 (Architecture Fix)"
    HF_TOKEN: str
    LLM_REPO_ID: str = "deepseek-ai/DeepSeek-R1"

    # تأكد إنك بتستخدم ملف .keras
    MODEL_PATH: str = "models/brain_tumor_model99.keras"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

# ===============================================================
# 3. DATA SCHEMAS
# ===============================================================


class PredictionResponse(BaseModel):
    class_label_en: str = Field(..., description="English Diagnosis")
    class_label_ar: str = Field(..., description="Arabic Diagnosis")
    confidence_level: str = Field(..., description="Confidence percentage")
    generated_advice: str = Field(..., description="Medical advice")

# ===============================================================
# 4. PREPROCESSING
# ===============================================================


class ImagePreprocessor:
    def __init__(self):
        self.target_size = (299, 299)

    def preprocess(self, image_bytes: bytes) -> np.ndarray:
        try:
            img = Image.open(BytesIO(image_bytes)).convert("RGB")
            img = img.resize(self.target_size)

            img_array = tf_image.img_to_array(img)
            img_array = np.expand_dims(img_array, axis=0)
            img_array = img_array / 255.0

            return img_array
        except Exception as e:
            logger.error(f"Preprocessing failed: {e}")
            raise HTTPException(
                status_code=400, detail="Invalid image format.")

# ===============================================================
# 5. MODEL SERVICE (The Fix)
# ===============================================================


class ModelService:
    def __init__(self):
        self.model = None
        self.preprocessor = ImagePreprocessor()

    def _build_model_architecture(self):
        img_shape = (299, 299, 3)

        # 1. Base Model (Xception)
        base_model = Xception(
            include_top=False,
            weights=None,
            input_shape=img_shape,
            pooling='max'
        )

        # 2. Sequential Mode
        model = Sequential([
            Input(shape=img_shape),

            base_model,
            BatchNormalization(),
            Dropout(rate=0.3),
            Dense(128, activation='relu'),
            Dropout(rate=0.25),
            Dense(4, activation='softmax')
        ])

        return model

    def load_resources(self):
        logger.info("🚀 Building Model Architecture & Loading Weights...")
        try:
            # 1. بناء الهيكل
            self.model = self._build_model_architecture()

            # 2. تحميل الأوزان من ملف .keras
            self.model.load_weights(settings.MODEL_PATH)

            logger.info("✅ Brain Tumor Model Loaded Successfully.")
        except Exception as e:
            logger.critical(f"🔥 Failed to load model weights: {e}")
            raise RuntimeError(f"Model loading failed: {e}")

    def predict(self, img_array: np.ndarray) -> Tuple[str, float]:
        predictions = self.model.predict(img_array)
        class_idx = np.argmax(predictions[0])
        confidence = float(np.max(predictions[0]))

        label_en = CLASS_NAMES_LIST[class_idx]

        logger.info(f"Prediction: {label_en} ({confidence:.4f})")
        return label_en, confidence

# ===============================================================
# ===============================================================
# 6. ADVICE SERVICE (Egyptian Slang V3)
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
        if disease_en == "notumor":
            if user_role in (UserRole.doctor, UserRole.Doctor):
                return f"""**AI Diagnostic Confidence:** {confidence_pct}\n\n**Findings:** No evidence of intracranial mass lesion on MRI. Brain parenchyma appears normal.\n\n**Recommendation:** If patient presents with persistent neurological symptoms, consider further workup (e.g., MRA, lumbar puncture, or referral to neurology)."""
            return f"""**نسبة ثقة التشخيص:** {confidence_pct}\n\nالحمد لله يا بطل، الأشعة زي الفل ومفيش أي حاجة وحشة (No Tumor) ❤️.\n\nالنتيجة دي تطمن جداً. لو لسه حاسس بصداع أو دوخة، ممكن تكشف نظر أو تروح لدكتور باطنة يشوف الضغط، لكن من ناحية المخ اطمن 100%."""
        if confidence < 0.50:
            if user_role in (UserRole.doctor, UserRole.Doctor):
                return f"**AI Diagnostic Confidence:** {confidence_pct}\n\nConfidence level is low. Direct clinical examination and additional imaging (contrast-enhanced MRI, CT) are recommended to confirm diagnosis."
            return f"**نسبة ثقة التشخيص:** {confidence_pct}\n\n⚠️ النتيجة مش واضحة أوي في الصورة دي. عشان نبقى في السليم، يفضل تعرض الفيلم الأصلي للأشعة على دكتور مخ وأعصاب عشان يشخص صح."
        return None

    def _get_error_fallback(self, disease_en: str, disease_ar: str, user_role: UserRole) -> str:
        """Return error fallback text."""
        if user_role in (UserRole.doctor, UserRole.Doctor):
            return f"An error occurred generating the clinical report. Please refer to specialized neuro-oncology references for: {disease_en}."
        return f"معلش حصل مشكلة صغيرة، بس بننصحك تروح لدكتور مخ وأعصاب فوراً عشان تطمن على نتيجة {disease_ar}."

    def _build_messages(self, disease_en: str, disease_ar: str, confidence_pct: str, user_role: UserRole):
        """Build LLM messages for tumor cases."""
        if user_role in (UserRole.doctor, UserRole.Doctor):
            return [
                {
                    "role": "system",
                    "content": """You are a neuro-oncology assistant providing organized clinical summaries to physicians. Use proper medical terminology and format with clear section headers."""
                },
                {
                    "role": "user",
                    "content": f"""
                    Brain MRI Finding: "{disease_en}"
                    
                    Provide an ORGANIZED clinical report with the following format:
                    
                    **AI Diagnostic Confidence:** {confidence_pct}
                    
                    **1. Clinical Description & Characteristics:**
                    [Key imaging features, typical location, WHO grade if applicable]
                    
                    **2. Differential Diagnosis:**
                    - [First differential]
                    - [Second differential]
                    
                    **3. Management Options:**
                    - Surgical: [options]
                    - Adjuvant: [radiation/chemotherapy if applicable]
                    - Observation: [if indicated]
                    
                    **4. Recommended Workup:**
                    [Additional imaging, labs, or biopsy]
                    
                    **5. Clinical Note:**
                    [Prognosis considerations and referral recommendations]
                    
                    Keep response around 200-250 words. Final decision rests with treating physician.
                    """
                }
            ]
        else:
            return [
                {
                    "role": "system",
                    "content": """أنت مساعد طبي ودود متخصص في أورام المخ. بتتكلم باللهجة المصرية العامية. نظم ردك بعناوين واضحة. متوصفش أدوية."""
                },
                {
                    "role": "user",
                    "content": f"""
                    المريض عمل رنين (MRI) والنظام لقى احتمالية: "{disease_ar}" ({disease_en}).
                    
                    اكتب رد منظم بالشكل ده:
                    
                    **نسبة ثقة التشخيص:** {confidence_pct}
                    
                    **🧠 إيه هي الحالة دي؟**
                    [شرح بسيط ومفهوم بدون تخويف]
                    
                    **📝 الخطوات الجاية:**
                    - [روح لدكتور إيه]
                    - [خد معاك إيه]
                    
                    **⚠️ علامات الخطر - روح المستشفى فوراً لو:**
                    [علامة أو اتنين]
                    
                    **❤️ كلمة مطمنة:**
                    [الطب اتقدم والعلاج موجود]
                    
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
                temperature=0.4
            )
            response_text = response.choices[0].message.content.strip()
            response_text = re.sub(r'<think>[\s\S]*?(?:</think>|$)', '', response_text).strip()
            response_text = re.sub(r'<br\s*/?>', '\n', response_text)
            return response_text
        except Exception as e:
            logger.error(f"DeepSeek Error: {e}")
            return self._get_error_fallback(disease_en, disease_ar, user_role)

    def generate_advice_stream(self, disease_en: str, disease_ar: str, confidence: float, user_role: UserRole = UserRole.patient):
        """Generator that yields advice tokens one at a time. Blocks (not async)."""
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
                temperature=0.4,
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
# 7. APP LIFECYCLE & ENDPOINTS
# ===============================================================
model_service = ModelService()
advice_service = AdviceService()


@asynccontextmanager
async def lifespan(app: FastAPI):
    model_service.load_resources()
    yield
    try:
        tf.keras.backend.clear_session()
    except:
        pass

app = FastAPI(title=settings.APP_NAME,
              version=settings.VERSION, lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=[
                   "*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


@app.post("/predict", response_model=PredictionResponse)
async def predict_brain_mri(
    file: UploadFile = File(...),
    user_role: UserRole = Query(default=UserRole.patient, description="User role: 'doctor' for clinical details or 'patient' for general advice")
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(400, detail="Invalid file type.")

    try:
        contents = await file.read()
        img_array = model_service.preprocessor.preprocess(contents)

        label_en, confidence = model_service.predict(img_array)
        label_ar = ARABIC_DISEASE_NAMES.get(label_en, label_en)
        
        # Generate role-based advice
        # Doctor: English with medical terminology
        # Patient: Egyptian Arabic with specialist recommendation
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
        raise HTTPException(500, detail="Processing Error.")


@app.post("/predict/stream")
async def predict_stream(
    file: UploadFile = File(...),
    user_role: UserRole = Query(default=UserRole.patient)
):
    """SSE streaming endpoint — returns text/event-stream."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(400, detail="Invalid file type.")

    contents = await file.read()
    img_array = model_service.preprocessor.preprocess(contents)
    label_en, confidence = model_service.predict(img_array)
    label_ar = ARABIC_DISEASE_NAMES.get(label_en, label_en)

    def event_generator():
        yield make_metadata_event(
            label=label_en,
            confidence=round(confidence, 4),
            model="brain-tumor",
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

# uvicorn main:app --reload --host 0.0.0.0 --port 8001
# http://localhost:8001/docs
