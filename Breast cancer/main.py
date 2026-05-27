import os
import json
import logging
from contextlib import asynccontextmanager
from typing import Tuple
from io import BytesIO
from enum import Enum
import re

import cv2
import numpy as np
from PIL import Image

# ---------------------------------------------------------------
# TensorFlow / Keras Imports
# ---------------------------------------------------------------
import tensorflow as tf
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Dense, Dropout, BatchNormalization, Input, GlobalAveragePooling2D
from tensorflow.keras.applications import DenseNet121

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
CLASS_NAMES_LIST = ['Benign', 'Malignant']

ARABIC_DISEASE_NAMES = {
    "Benign": "ورم حميد (Benign)",
    "Malignant": "ورم خبيث (Malignant)"
}

# ===============================================================
# 2. CONFIGURATION & SETTINGS
# ===============================================================
logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("BreastCancerAPI")


class Settings(BaseSettings):
    APP_NAME: str = "Breast Cancer AI (Egyptian Arabic)"
    VERSION: str = "5.0.0 (DenseNet121 V16)"
    HF_TOKEN: str
    LLM_REPO_ID: str = "deepseek-ai/DeepSeek-R1"

    MODEL_PATH: str = "models/best_inbreast_v16.keras"

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
# 4. PREPROCESSING (V16 Multi-Fusion)
# ===============================================================

class ImagePreprocessor:
    def __init__(self):
        self.target_size = (384, 384)
        self.clahe_clip = 2.0
        self.clahe_grid = (8, 8)
        self.high_boost_a = 1.5

    def crop_breast_tissue(self, gray: np.ndarray) -> np.ndarray:
        _, thresh = cv2.threshold(gray, 15, 255, cv2.THRESH_BINARY)
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return gray
        largest_contour = max(contours, key=cv2.contourArea)
        x, y, w, h = cv2.boundingRect(largest_contour)
        return gray[y:y+h, x:x+w]

    def clahe_enhance(self, gray: np.ndarray) -> np.ndarray:
        clahe = cv2.createCLAHE(clipLimit=self.clahe_clip, tileGridSize=self.clahe_grid)
        return clahe.apply(gray)

    def high_boost_filter(self, gray: np.ndarray) -> np.ndarray:
        gray_f = gray.astype(np.float32)
        low_pass = cv2.GaussianBlur(gray_f, (5, 5), 0)
        hb = np.clip(self.high_boost_a * gray_f - low_pass, 0, 255).astype(np.uint8)
        return hb

    def invert_image(self, gray: np.ndarray) -> np.ndarray:
        return (255 - gray).astype(np.uint8)

    def preprocess(self, image_bytes: bytes) -> np.ndarray:
        try:
            nparr = np.frombuffer(image_bytes, np.uint8)
            gray = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
            
            if gray is None:
                raise ValueError("Could not decode image.")

            gray_cropped = self.crop_breast_tissue(gray)
            
            ch_clahe = self.clahe_enhance(gray_cropped)
            ch_boost = self.high_boost_filter(gray_cropped)
            ch_inv   = self.invert_image(gray_cropped)
            fused = np.stack([ch_clahe, ch_boost, ch_inv], axis=-1)
            
            fused = cv2.resize(fused, self.target_size, interpolation=cv2.INTER_LANCZOS4)

            img_array = fused.astype(np.float32) / 255.0
            img_array = np.expand_dims(img_array, axis=0)

            return img_array
        except Exception as e:
            logger.error(f"Preprocessing failed: {e}")
            raise HTTPException(status_code=400, detail="Invalid image format or processing error.")

# ===============================================================
# 5. MODEL SERVICE 
# ===============================================================

class ModelService:
    def __init__(self):
        self.model = None
        self.preprocessor = ImagePreprocessor()

    def _build_model_architecture(self):
        img_shape = (384, 384, 3)

        base_model = DenseNet121(
            include_top=False,
            weights=None, 
            input_shape=img_shape
        )

        inp = Input(shape=img_shape, name="input")
        x   = base_model(inp)
        x   = GlobalAveragePooling2D(name="gap")(x)
        x   = BatchNormalization(name="head_bn")(x)
        x   = Dropout(0.50, name="head_dropout")(x)
        out = Dense(1, activation="sigmoid", name="output")(x)

        model = Model(inputs=inp, outputs=out, name="DenseNet121_V16")
        return model

    def load_resources(self):
        logger.info("🚀 Building Model Architecture & Loading Weights...")
        try:
            self.model = self._build_model_architecture()
            self.model.load_weights(settings.MODEL_PATH)
            logger.info("✅ Breast Cancer Model Loaded Successfully.")
        except Exception as e:
            logger.critical(f"🔥 Failed to load model weights: {e}")
            raise RuntimeError(f"Model loading failed: {e}")

    def predict(self, img_array: np.ndarray) -> Tuple[str, float]:
        predictions = self.model.predict(img_array)
        prob_malignant = float(predictions[0][0])
        
        if prob_malignant >= 0.50:
            label_en = "Malignant"
            confidence = prob_malignant
        else:
            label_en = "Benign"
            confidence = 1.0 - prob_malignant

        logger.info(f"Prediction: {label_en} ({confidence:.4f})")
        return label_en, confidence

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
        if disease_en == "Benign" and confidence >= 0.60:
            if user_role in (UserRole.doctor, UserRole.Doctor):
                return f"""**AI Diagnostic Confidence:** {confidence_pct}\n\n**Findings:** Image findings strongly suggest a benign process (consistent with BI-RADS 2 or 3). Features typically match fibroadenomas, cysts, or benign calcifications.\n\n**Recommendation:** Routine screening or short-interval follow-up (6 months) as clinically indicated."""
            return f"""**نسبة ثقة التشخيص:** {confidence_pct}\n\nالحمد لله يا فندم، النتيجة بتشير إن الورم حميد (Benign) ومفيش أي علامات خبيثة ❤️.\n\nالنتيجة دي تطمن جداً، ممكن تكون مجرد كيس دهني أو تليف بسيط. الأفضل نعرض الأشعة دي على دكتور جراحة ثدي عشان يطمنك 100% ويقول لو في متابعة كمان 6 شهور."""
        if confidence < 0.60:
            if user_role in (UserRole.doctor, UserRole.Doctor):
                return f"**AI Diagnostic Confidence:** {confidence_pct}\n\nConfidence level is equivocal. Direct clinical correlation and additional imaging (e.g., Ultrasound, MRI) or biopsy are recommended to establish a definitive diagnosis."
            return f"**نسبة ثقة التشخيص:** {confidence_pct}\n\n⚠️ النتيجة مش واضحة أوي في الصورة دي ومحتاجة تقييم دقيق. عشان نبقى في السليم، يفضل تعرضي الأشعة دي على دكتور جراحة ثدي عشان يقيم الحالة بالسونار أو الفحص السريري."
        return None

    def _get_error_fallback(self, disease_en: str, disease_ar: str, user_role: UserRole) -> str:
        """Return error fallback text."""
        if user_role in (UserRole.doctor, UserRole.Doctor):
            return f"An error occurred generating the clinical report. Please refer to specialized breast oncology guidelines."
        return f"معلش حصلت مشكلة صغيرة في كتابة التقرير التفصيلي. أهم حاجة تاخدي الأشعة دي وتروحي لدكتور جراحة أورام ثدي النهاردة أو بكرة بالكتير وهو هيمشيكي في الصح ❤️."

    def _build_messages(self, disease_en: str, disease_ar: str, confidence_pct: str, user_role: UserRole):
        """Build LLM messages for malignant cases."""
        if user_role in (UserRole.doctor, UserRole.Doctor):
            return [
                {
                    "role": "system",
                    "content": "You are a breast oncology assistant providing organized clinical summaries to physicians. Use proper medical terminology and format with clear section headers."
                },
                {
                    "role": "user",
                    "content": f"""
                    Mammography AI Finding: "{disease_en}"
                    
                    Provide an ORGANIZED clinical report with the following format:
                    
                    **AI Diagnostic Confidence:** {confidence_pct}
                    
                    **1. Clinical Interpretation (BI-RADS Suspicious):**
                    [Standard interpretation and typical features of suspected malignancy]
                    
                    **2. Recommended Diagnostics & Workup:**
                    - Specific views (e.g., magnification, spot compression)
                    - Ultrasound / Breast MRI indication
                    - Biopsy recommendation (core needle / vacuum-assisted)
                    
                    **3. Initial Management Pathway:**
                    - Multidisciplinary team (MDT) considerations
                    
                    Keep response around 150-200 words. Final decision rests with the treating physician.
                    """
                }
            ]
        else:
            return [
                {
                    "role": "system",
                    "content": "أنت مساعد طبي ودود جداً ومتعاطف متخصص في أورام الثدي. بتتكلم باللهجة المصرية العامية. نظم ردك بعناوين واضحة. متوصفش أدوية وكلامك لازم يكون مليان أمل."
                },
                {
                    "role": "user",
                    "content": f"""
                    الذكاء الاصطناعي لقى احتمالية: "{disease_ar}".
                    
                    اكتب رد منظم بالشكل ده بلهجة مصرية عامية حنينة ومطمنة:
                    
                    **نسبة ثقة التشخيص:** {confidence_pct}
                    
                    **🌸 الخطوة دي معناها إيه؟**
                    [شرح إن دي أداة اشتباه ولسه محتاجين تأكيد طبي ومفيش داعي للخوف بدري]
                    
                    **📝 هعمل إيه دلوقتي؟**
                    - [نروح لدكتور جراحة أورام ثدي بسرعة]
                    - [هيحتاج يعمل إيه زي عينة لحسم النتيجة]
                    
                    **❤️ كلمة مطمنة ليكي:**
                    [الطب اتقدم جداً وعلاج أورام الثدي دلوقتي نسبة الشفاء فيها بتعدي 90% لو اتلحقت بدري، إنتي قوية وهتعدي]
                    
                    خلي الرد حوالي 120-150 كلمة. متوصفش أي أدوية وادعميها نفسياً.
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

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


@app.post("/predict", response_model=PredictionResponse)
async def predict_breast_mammogram(
    file: UploadFile = File(...),
    user_role: UserRole = Query(default=UserRole.patient, description="User role: 'doctor' or 'patient'")
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(400, detail="Invalid file type.")

    try:
        contents = await file.read()
        img_array = model_service.preprocessor.preprocess(contents)

        label_en, confidence = model_service.predict(img_array)
        label_ar = ARABIC_DISEASE_NAMES.get(label_en, label_en)
        
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
            model="breast-cancer",
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

# uvicorn main:app --reload --host 0.0.0.0 --port 8006
# http://localhost:8006/docs