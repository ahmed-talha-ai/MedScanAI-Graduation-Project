"""
MediScan Medical Center - Tools Module (UPDATED)

CRITICAL FIXES:
1. Auto-trigger image analysis without waiting for user command
2. Fixed file path handling (no JSON strings)
3. Added robust OCR with EasyOCR + Tesseract fallback
4. Smart medical data analysis with pattern matching
5. Vision model fallback rotation
"""

from langchain.tools.retriever import create_retriever_tool
from langchain_community.tools import TavilySearchResults
from langchain.tools import tool
from retriever import hybrid_retriever
import pytz
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, List
import json
import uuid
import base64
from PIL import Image
import io
import requests
from config import (
    OPENROUTER_API_KEY,
    GROQ_API_KEY,
    HUGGINGFACE_API_TOKEN,
    SUPPORTED_IMAGE_FORMATS,
    MAX_FILE_SIZE_BYTES,
    IMAGE_MAX_SIZE,
    VISION_MODELS,
    logger
)
import re
import os
from pathlib import Path

# Try importing OCR libraries
try:
    import easyocr
    EASYOCR_AVAILABLE = True
except ImportError:
    logger.warning("EasyOCR not installed. Install with: pip install easyocr")
    EASYOCR_AVAILABLE = False

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    logger.warning("OpenCV not installed. Install with: pip install opencv-python")
    CV2_AVAILABLE = False

try:
    import pytesseract
    # Set Tesseract path for Windows
    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
    TESSERACT_AVAILABLE = True
except ImportError:
    logger.warning("Pytesseract not installed. Install with: pip install pytesseract")
    TESSERACT_AVAILABLE = False

# ============================================================================
# KNOWLEDGE RETRIEVAL TOOL
# ============================================================================

class RetrieverInput(BaseModel):
    """Input for the retriever tool."""
    model_config = {"extra": "allow"}
    query: str = Field(description="search query to look up in knowledge base")

@tool(args_schema=RetrieverInput)
def retriever_tool(query: str) -> str:
    """
    أداة للبحث في معلومات مجمع MediScan الطبي.
    استخدمها للإجابة عن معلومات المجمع والخدمات والأطباء.
    """
    try:
        docs = hybrid_retriever.invoke(query)
        return "\n\n".join([d.page_content for d in docs])
    except Exception as e:
        return f"Error retrieving information: {str(e)}"

# ============================================================================
# WEB SEARCH TOOL
# ============================================================================

class WebSearchInput(BaseModel):
    """Input for web search tool."""
    model_config = {"extra": "allow"}
    query: str = Field(description="search query")

@tool(args_schema=WebSearchInput)
def websearch_tool(query: str) -> str:
    """
    أداة للبحث عن المعلومات الطبية الموثوقة على الإنترنت.
    استخدمها لمعلومات عن الأمراض والأعراض والعلاجات.
    """
    try:
        tavily = TavilySearchResults(
            max_results=5,
            include_answer=True,
            include_raw_content=False,
            include_images=False,
            search_depth="advanced",
        )
        return tavily.invoke(query)
    except Exception as e:
        return f"Error searching web: {str(e)}"

# ============================================================================
# CURRENT DATETIME TOOL
# ============================================================================

@tool
def get_current_datetime_tool() -> str:
    """
    يعيد التاريخ والوقت الحالي في مصر (Africa/Cairo).
    """
    try:
        egypt_tz = pytz.timezone('Africa/Cairo')
        now_egypt = datetime.now(egypt_tz)
        
        days_ar = {
            0: "الإثنين", 1: "الثلاثاء", 2: "الأربعاء", 3: "الخميس",
            4: "الجمعة", 5: "السبت", 6: "الأحد"
        }
        months_ar = {
            1: "يناير", 2: "فبراير", 3: "مارس", 4: "أبريل",
            5: "مايو", 6: "يونيو", 7: "يوليو", 8: "أغسطس",
            9: "سبتمبر", 10: "أكتوبر", 11: "نوفمبر", 12: "ديسمبر"
        }
        
        day_name_ar = days_ar[now_egypt.weekday()]
        month_name_ar = months_ar[now_egypt.month]
        
        hour = now_egypt.hour
        if hour == 0:
            hour_12 = 12
            period_ar = "صباحاً"
        elif hour < 12:
            hour_12 = hour
            period_ar = "صباحاً"
        elif hour == 12:
            hour_12 = 12
            period_ar = "ظهراً"
        else:
            hour_12 = hour - 12
            period_ar = "مساءً"
        
        time_str_ar = f"{hour_12:02d}:{now_egypt.minute:02d} {period_ar}"
        
        result = f"""
التاريخ والوقت الحالي في مصر:
{day_name_ar}، {now_egypt.day} {month_name_ar} {now_egypt.year} - الساعة {time_str_ar}
"""
        
        return result.strip()
    
    except Exception as e:
        return f"خطأ في الحصول على التاريخ والوقت: {str(e)}"

# ============================================================================
# APPOINTMENT BOOKING TOOL
# ============================================================================

class BookingInput(BaseModel):
    """Inputs for appointment booking tool"""
    model_config = {"extra": "allow"}
    patient_name: Optional[str] = Field(None, description="اسم المريض الكامل")
    age: Optional[str] = Field(None, description="عمر المريض")
    gender: Optional[str] = Field(None, description="جنس المريض (ذكر/أنثى)")
    contact_number: Optional[str] = Field(None, description="رقم الهاتف")
    email: Optional[str] = Field(None, description="البريد الإلكتروني")
    reason_for_consultation: Optional[str] = Field(None, description="سبب الزيارة أو الأعراض")
    preferred_date: Optional[str] = Field(None, description="التاريخ المفضل")
    preferred_time: Optional[str] = Field(None, description="الوقت المفضل")
    specialty: Optional[str] = Field(None, description="التخصص المطلوب")
    doctor_preference: Optional[str] = Field(None, description="اسم الطبيب المفضل")

@tool(args_schema=BookingInput)
def book_consultation_tool(
    patient_name: Optional[str] = None,
    age: Optional[str] = None,
    gender: Optional[str] = None,
    contact_number: Optional[str] = None,
    email: Optional[str] = None,
    reason_for_consultation: Optional[str] = None,
    preferred_date: Optional[str] = None,
    preferred_time: Optional[str] = None,
    specialty: Optional[str] = None,
    doctor_preference: Optional[str] = None
) -> str:
    """
    أداة حجز المواعيد الطبية.
    """
    
    missing_fields = []
    if not patient_name:
        missing_fields.append("اسم المريض (patient_name)")
    if not age:
        missing_fields.append("العمر (age)")
    if not gender:
        missing_fields.append("الجنس (gender)")
    if not contact_number:
        missing_fields.append("رقم التليفون (contact_number)")
    if not reason_for_consultation:
        missing_fields.append("سبب الزيارة (reason_for_consultation)")
    if not preferred_date:
        missing_fields.append("التاريخ المفضل (preferred_date)")
    if not preferred_time:
        missing_fields.append("الوقت المفضل (preferred_time)")
    
    if not email:
        email = "noemail@mediscan-eg.com"
    
    if missing_fields:
        missing_str = "\n- ".join([""] + missing_fields)
        return f"""
عذراً، لا يمكن إتمام الحجز بسبب نقص المعلومات المطلوبة:
{missing_str}

يرجى توفير هذه المعلومات لإكمال الحجز.
"""
    
    booking_id = f"MS-{uuid.uuid4().hex[:8].upper()}"
    timestamp = datetime.now().isoformat()
    
    booking_data = {
        "booking_id": booking_id,
        "booking_timestamp": timestamp,
        "patient_details": {
            "name": patient_name,
            "age": age,
            "gender": gender,
            "contact_number": contact_number,
            "email": email
        },
        "consultation_details": {
            "reason": reason_for_consultation,
            "preferred_date": preferred_date,
            "preferred_time": preferred_time,
            "specialty": specialty or "غير محدد",
            "doctor_preference": doctor_preference or "أي طبيب متاح",
        },
        "status": "pending_confirmation",
        "clinic": "MediScan Medical Center"
    }
    
    return json.dumps(booking_data, indent=2, ensure_ascii=False)

# ============================================================================
# OCR & MEDICAL ANALYSIS FUNCTIONS
# ============================================================================

def extract_text_from_image(image_path: str) -> str:
    """
    Extract text from medical reports with high accuracy.
    Uses EasyOCR (primary) + Tesseract (fallback).
    """
    try:
        extracted_text = ""
        
        # Try EasyOCR first (best for Arabic + English mix)
        if EASYOCR_AVAILABLE:
            try:
                logger.info("Using EasyOCR for text extraction...")
                reader = easyocr.Reader(['ar', 'en'], gpu=True)  # Enable GPU
                results = reader.readtext(image_path)
                
                extracted_lines = []
                for (bbox, text, conf) in results:
                    if conf > 0.3:  # Filter low confidence
                        extracted_lines.append(text)
                
                extracted_text = "\n".join(extracted_lines)
                logger.info(f"EasyOCR extracted {len(extracted_lines)} lines")
                
            except Exception as e:
                logger.error(f"EasyOCR failed: {e}")
        
        # Fallback to Tesseract if EasyOCR failed or found nothing
        if not extracted_text.strip() and TESSERACT_AVAILABLE and CV2_AVAILABLE:
            try:
                logger.info("Falling back to Tesseract...")
                img = cv2.imread(image_path)
                extracted_text = pytesseract.image_to_string(img, lang='ara+eng')
                logger.info("Tesseract extraction complete")
            except Exception as e:
                logger.error(f"Tesseract failed: {e}")
        
        if not extracted_text.strip():
            return "⚠️ مفيش نص واضح في الصورة. تأكد إن الصورة واضحة وجرب تاني."
        
        return extracted_text
        
    except Exception as e:
        logger.error(f"OCR Error: {e}")
        return f"❌ حصل مشكلة في قراءة الصورة: {str(e)}"

def analyze_medical_data(extracted_text: str, language: str = "ar") -> str:
    """
    Analyze medical lab results using pattern matching + LLM.
    Returns detailed medical analysis.
    
    Args:
        extracted_text: OCR extracted text from medical report
        language: "en" for English clinical, "ar" for Egyptian Arabic
    """
    # Pattern matching for common tests
    patterns = {
        'Hemoglobin': r'(hemoglobin|hb|hgb|هيموجلوبين)[:\s]*(\d+\.?\d*)',
        'Glucose': r'(glucose|sugar|سكر)[:\s]*(\d+\.?\d*)',
        'Cholesterol': r'(cholesterol|كوليسترول)[:\s]*(\d+\.?\d*)',
        'WBC': r'(wbc|white blood cell|كرات بيضاء)[:\s]*(\d+\.?\d*)',
        'RBC': r'(rbc|red blood cell|كرات حمراء)[:\s]*(\d+\.?\d*)',
        'Platelets': r'(platelet|صفائح)[:\s]*(\d+\.?\d*)',
        'Creatinine': r'(creatinine|كرياتينين)[:\s]*(\d+\.?\d*)',
        'TSH': r'(tsh|thyroid)[:\s]*(\d+\.?\d*)',
        'ALT': r'(alt|sgpt)[:\s]*(\d+\.?\d*)',
        'AST': r'(ast|sgot)[:\s]*(\d+\.?\d*)',
    }
    
    findings = []
    for test_name, pattern in patterns.items():
        matches = re.findall(pattern, extracted_text, re.IGNORECASE)
        if matches:
            value = matches[0][1]
            findings.append(f"{test_name}: {value}")
    
    # Generate language-specific analysis prompt
    if language == "en":
        # DOCTOR MODE: English, Clinical, Professional
        analysis_prompt = f"""You are a clinical laboratory specialist reviewing test results. Provide a professional clinical analysis.

**Lab Report Data:**
{extracted_text}

**Provide structured clinical analysis:**

📊 **Extracted Values:**
- List each parameter with reference ranges
- Mark ✅ within normal limits, ⚠️ abnormal

🔍 **Clinical Interpretation:**
- Clinical significance of abnormal values
- Differential considerations if applicable

💊 **Clinical Recommendations:**
- Suggested follow-up investigations
- Management considerations

⚠️ **Red Flags:**
- Values requiring urgent attention

**Language: English only. Professional clinical terminology.**"""
    else:
        # PATIENT MODE: Egyptian Arabic, Simple, Reassuring
        analysis_prompt = f"""انت دكتور مصري متخصص في تحليل التقارير الطبية. حلل البيانات دي باللهجة المصرية:

{extracted_text}

رد بشكل مختصر ومنظم **باللهجة المصرية فقط**:

📊 **القيم المستخرجة:**
- اذكر كل قيمة مع المعدل الطبيعي
- علّم ✅ للطبيعي و ⚠️ لغير الطبيعي

🔍 **التفسير:**
- اشرح بالعامية المصرية أي قيم غير طبيعية
- مثال: "القيمة دي عالية شوية" مش "هذه القيمة مرتفعة"

💡 **نصيحة سريعة:**
- نصيحة أو اتنين مهمين

⚠️ **لازم تروح للدكتور لو:**
- اذكر الحالات اللي لازم يستشير فيها طبيب

مهم جداً: 
- استخدم "ده/دي" مش "هذا/هذه"
- استخدم "مفيش" مش "لا يوجد"
- استخدم "عايز/محتاج" مش "تريد/تحتاج"
- ممنوع الفصحى نهائياً!"""
    
    try:
        from config import LLM
        response = LLM.invoke(analysis_prompt)
        return response.content
    except Exception as e:
        if language == "en":
            return f"""📊 **Results:**
{chr(10).join(findings) if findings else "No clear numeric values extracted"}

⚠️ Please consult a physician for clinical interpretation."""
        else:
            return f"""📊 **النتايج:**
{chr(10).join(findings) if findings else "مش لاقي قيم رقمية واضحة"}

⚠️ روح لدكتور متخصص علشان يراجع النتايج معاك."""

# ============================================================================
# VISION MODEL FALLBACK FUNCTION
# ============================================================================

def analyze_with_vision_models(image_path: str, prompt: str) -> str:
    """
    Try vision models in sequence with rate limiting.
    Implements smart fallback across Groq + OpenRouter.
    """
    # Import rate limiter
    try:
        from rate_limiter import quota_tracker, throttle_request, is_rate_limit_error
    except ImportError:
        quota_tracker = None
    
    # Load and preprocess image
    try:
        image = Image.open(image_path)
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Resize if needed
        if image.size[0] > IMAGE_MAX_SIZE[0] or image.size[1] > IMAGE_MAX_SIZE[1]:
            image.thumbnail(IMAGE_MAX_SIZE, Image.Resampling.LANCZOS)
        
        # Convert to base64
        buffered = io.BytesIO()
        image.save(buffered, format="JPEG", quality=80)  # Reduced quality to save bandwidth
        img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
        data_url = f"data:image/jpeg;base64,{img_base64}"
        
    except Exception as e:
        return f"❌ خطأ في معالجة الصورة: {str(e)}"
    
    # Try each vision model
    last_error = None
    
    for model_config in VISION_MODELS:
        try:
            provider = model_config["provider"]
            model_name = model_config["model"]
            
            # Check rate limit
            if quota_tracker and not quota_tracker.can_make_request(provider):
                logger.warning(f"⏳ {provider} rate limited, trying next...")
                continue
            
            logger.info(f"Trying {model_config['name']}...")
            
            # Throttle request
            if quota_tracker:
                throttle_request(provider)
            
            # Initialize client based on provider
            if provider == "groq":
                if not GROQ_API_KEY:
                    continue
                    
                from langchain_groq import ChatGroq
                chat = ChatGroq(
                    groq_api_key=GROQ_API_KEY,
                    model_name=model_name,
                    temperature=0.1,
                    max_tokens=3000,  # Reduced for faster responses
                    request_timeout=25,
                )
                
            elif provider == "openrouter":
                if not OPENROUTER_API_KEY:
                    continue
                    
                from langchain_openai import ChatOpenAI
                chat = ChatOpenAI(
                    api_key=OPENROUTER_API_KEY,
                    base_url="https://openrouter.ai/api/v1",
                    model=model_name,
                    temperature=0.1,
                    max_tokens=3000,  # Reduced for faster responses
                    request_timeout=25,
                )
            else:
                continue
            
            # Create messages
            from langchain_core.messages import HumanMessage, SystemMessage
            
            system_msg = SystemMessage(content="""انت دكتور مصري. حلل الصورة باللهجة المصرية 100%.
قواعد مهمة:
- استخدم "ده/دي" مش "هذا/هذه"
- استخدم "مفيش" مش "لا يوجد"
- استخدم "عايز" مش "تريد"
- ممنوع الفصحى!""")
            
            human_msg = HumanMessage(content=[
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": data_url}}
            ])
            
            # Invoke model
            response = chat.invoke([system_msg, human_msg])
            
            if response.content:
                logger.info(f"✅ Success with {model_config['name']}")
                if quota_tracker:
                    quota_tracker.record_request(provider)
                return response.content
            
        except Exception as e:
            last_error = e
            error_str = str(e).lower()
            
            # Handle rate limit errors
            if quota_tracker and ("429" in str(e) or "rate" in error_str or "quota" in error_str):
                quota_tracker.record_error_429(provider)
                logger.warning(f"⏳ {model_config['name']} rate limited: {e}")
            else:
                logger.warning(f"❌ {model_config['name']} failed: {e}")
            continue
    
    # All models failed
    return f"❌ مقدرش أحلل الصورة دلوقتي. جرب تاني بعد شوية. ({str(last_error)[:50]})"

# ============================================================================
# MEDICAL IMAGE ANALYSIS TOOL (MAIN)
# ============================================================================

class ImageAnalysisInput(BaseModel):
    """Input for medical image analysis"""
    model_config = {"extra": "allow"}
    image_path: str = Field(description="مسار الصورة الطبية")
    image_type: Optional[str] = Field("auto", description="نوع الصورة")
    patient_symptoms: Optional[str] = Field(None, description="الأعراض")
    analysis_language: Optional[str] = Field("ar", description="لغة التحليل")

@tool(args_schema=ImageAnalysisInput)
def analyze_medical_image_tool(
    image_path: str,
    image_type: Optional[str] = "auto",
    patient_symptoms: Optional[str] = None,
    analysis_language: Optional[str] = "ar"
) -> str:
    """
    أداة تحليل الصور الطبية (تحاليل، أشعة، تقارير).
    تقوم باستخراج النصوص وتحليل البيانات تلقائياً.
    
    Args:
        image_path: Path to the medical image
        image_type: Type of image (auto, lab_report, xray)
        patient_symptoms: Optional patient symptoms
        analysis_language: "en" for English clinical, "ar" for Egyptian Arabic
    """
    
    # Determine language mode
    is_english = analysis_language == "en"
    
    try:
        # 1. Validate image file
        img_path = Path(image_path)
        
        # Clean path (remove quotes, double backslashes)
        if not img_path.exists():
            clean_path = image_path.replace('"', '').replace("'", "").replace("\\\\", "\\")
            img_path = Path(clean_path)
        
        if not img_path.exists():
            if is_english:
                return f"❌ Image not found at: {image_path}"
            return f"❌ مش لاقي الصورة في المكان ده: {image_path}"
        
        # 2. Check file size
        file_size = img_path.stat().st_size
        if file_size > MAX_FILE_SIZE_BYTES:
            if is_english:
                return f"❌ Image too large ({file_size / (1024*1024):.1f} MB). Max: {MAX_FILE_SIZE_BYTES / (1024*1024):.1f} MB"
            return f"❌ الصورة كبيرة أوي ({file_size / (1024*1024):.1f} ميجا). الحد الأقصى {MAX_FILE_SIZE_BYTES / (1024*1024):.1f} ميجا"
        
        # 3. Try OCR first (best for lab reports)
        logger.info(f"Extracting text from: {img_path}")
        extracted_text = extract_text_from_image(str(img_path))
        
        # 4. If OCR found substantial text, analyze it with language
        if extracted_text and len(extracted_text.strip()) > 20 and "لم يتم العثور" not in extracted_text:
            logger.info(f"OCR successful. Performing smart analysis (language={analysis_language})...")
            analysis_result = analyze_medical_data(extracted_text, language=analysis_language)
            
            if is_english:
                return f"""✅ **Analysis Complete**

📊 **Clinical Report:**

{analysis_result}

---
⚠️ **Disclaimer**: These findings are AI-generated and require clinical correlation. Final diagnosis and treatment decisions rest with the treating physician.
"""
            else:
                return f"""✅ **تم التحليل بنجاح!**

📊 **التقرير:**

{analysis_result}

---
⚠️ **تنبيه**: النتايج دي تقديرية. لازم تروح لدكتور متخصص للتأكيد.
"""
        
        # 5. If OCR failed, try Vision Models with language-specific prompt
        logger.info(f"OCR found little/no text. Trying vision models (language={analysis_language})...")
        
        if is_english:
            # DOCTOR MODE: English Clinical Prompt
            prompt = f"""You are a clinical radiologist/pathologist analyzing a medical image. Provide a professional clinical analysis.

**Image Type:** {image_type}
**Clinical History:** {patient_symptoms or "Not specified"}

**Provide structured analysis:**

📊 **Imaging Findings:**
- Describe key observations
- Note any abnormalities with clinical significance

🔍 **Clinical Interpretation:**
- Differential diagnoses if applicable
- Correlation with clinical history

💊 **Recommendations:**
- Suggested follow-up studies
- Clinical management considerations

⚠️ **Critical Findings:**
- Flag any urgent findings

**Language: English only. Professional clinical terminology.**
"""
        else:
            # PATIENT MODE: Egyptian Arabic Prompt
            prompt = f"""
حلل الصورة الطبية دي باللهجة المصرية بس:

نوع الصورة: {image_type}
الأعراض: {patient_symptoms or "مش محددة"}

استخرج القيم وقولي:
📊 القيم الموجودة (✅ طبيعي / ⚠️ محتاج متابعة)
💡 نصيحة مختصرة
🏥 لازم تروح للدكتور لو...

قواعد مهمة:
- استخدم "ده/دي" مش "هذا/هذه"
- استخدم "مفيش" مش "لا يوجد" 
- ممنوع الفصحى نهائياً!
"""
        
        vision_analysis = analyze_with_vision_models(str(img_path), prompt)
        
        if is_english:
            return f"""
✅ **Medical Image Analysis (Vision AI)**

{vision_analysis}

---
⚠️ **Disclaimer**: AI-generated findings require clinical correlation. Consult treating physician for final diagnosis.
"""
        else:
            return f"""
✅ **تحليل الصورة (Vision AI)**

{vision_analysis}

---
⚠️ **تنبيه**: لازم تستشير دكتور متخصص للتأكيد والعلاج.
"""
        
    except Exception as e:
        logger.error(f"Error in analyze_medical_image_tool: {e}")
        import traceback
        traceback.print_exc()
        if is_english:
            return f"❌ Error occurred: {str(e)}"
        return f"❌ حصلت مشكلة: {str(e)}"

# ============================================================================
# EXPORT ALL TOOLS
# ============================================================================

ALL_TOOLS = [
    retriever_tool,
    websearch_tool,
    get_current_datetime_tool,
    book_consultation_tool,
    analyze_medical_image_tool
]

logger.info("✅ All tools loaded successfully")
logger.info(f"📋 Available tools: {len(ALL_TOOLS)}")
logger.info(f"🔧 OCR: EasyOCR={'✅' if EASYOCR_AVAILABLE else '❌'}, Tesseract={'✅' if TESSERACT_AVAILABLE else '❌'}")
logger.info(f"👁️ Vision Models: {len(VISION_MODELS)} available")