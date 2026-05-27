"""
MediScan - AI Doctor Report API Router
=======================================
AI-generated medical reports for doctors based on patient profile.
This generates real-time AI summaries from patient profile data only.
"""

import os
import sys
import logging
from datetime import datetime
from typing import Dict, Any, Optional

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__)), 'src'))

from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

router = APIRouter()


# ============================================================================
# MODELS
# ============================================================================

class DoctorReportResponse(BaseModel):
    status: str
    patient_id: str
    report: str
    generated_at: str
    profile_based: bool = True


# ============================================================================
# LAZY LOADING
# ============================================================================

_history_loaded = False
_history_manager = None
_llm_loaded = False
_llm = None


def load_history_manager() -> Dict[str, Any]:
    """Lazy load the medical history manager."""
    global _history_loaded, _history_manager
    if not _history_loaded:
        logger.info("🔄 Loading medical history manager...")
        from src.medical_history import get_history_manager
        _history_manager = get_history_manager()
        _history_loaded = True
        logger.info("✅ Medical history manager loaded")
    return _history_manager


def load_llm():
    """Lazy load the LLM for report generation."""
    global _llm_loaded, _llm
    if not _llm_loaded:
        logger.info("🔄 Loading LLM for report generation...")
        try:
            from src.config import LLM
            _llm = LLM
        except ImportError:
            from config import LLM
            _llm = LLM
        _llm_loaded = True
        logger.info("✅ LLM loaded for reports")
    return _llm


def get_timestamp() -> str:
    """Get current timestamp in ISO format."""
    return datetime.now().isoformat()


# ============================================================================
# AI REPORT GENERATION
# ============================================================================

def generate_ai_doctor_report(patient_profile: Dict[str, Any], language: str = "ar") -> str:
    """
    Generate AI-organized medical report for doctors based on patient profile.
    
    Args:
        patient_profile: Patient data (diseases, allergies, medications, family_history)
        language: "en" for English clinical, "ar" for Arabic
    
    Returns:
        Organized medical summary with warnings
    """
    llm = load_llm()
    is_english = language == "en"
    
    # Extract patient data
    profile = patient_profile.get("profile", {})
    conditions = patient_profile.get("conditions", [])
    medications = patient_profile.get("medications", [])
    allergies = patient_profile.get("allergies", [])
    family_history = patient_profile.get("family_history", [])
    blood_type = patient_profile.get("blood_type", "N/A")
    
    # Format family history
    def format_family_history(fh_list, lang="en"):
        if not fh_list:
            return "• None documented" if lang == "en" else "• لا يوجد تاريخ عائلي مسجل"
        
        formatted = []
        for fh in fh_list:
            rel = fh.get('relation', 'Unknown')
            cond = fh.get('condition', 'Unknown')
            if rel == 'Unknown' or not rel:
                formatted.append(f"• {cond}")
            else:
                formatted.append(f"• {rel}: {cond}")
        return chr(10).join(formatted)
    
    if is_english:
        # ENGLISH CLINICAL REPORT PROMPT (For Doctors)
        prompt = f"""You are a clinical decision support AI generating a physician-oriented medical report.

═══════════════════════════════════════════════════════════
📋 PATIENT DATA
═══════════════════════════════════════════════════════════
Name: {profile.get('name', 'N/A')}
Age: {profile.get('age', 'N/A')}
Gender: {profile.get('gender', 'N/A')}
Phone: {profile.get('phone', 'N/A') if profile.get('phone') else 'N/A'}
Blood Type: {blood_type}

🏥 Chronic Conditions:
{chr(10).join([f"• {c}" for c in conditions]) if conditions else "• None documented"}

💊 Current Medications:
{chr(10).join([f"• {m}" for m in medications]) if medications else "• None documented"}

⚠️ Known Allergies:
{chr(10).join([f"• {a}" for a in allergies]) if allergies else "• NKDA (No Known Drug Allergies)"}

👨‍👩‍👧 Family History:
{format_family_history(family_history, "en")}

═══════════════════════════════════════════════════════════
📝 GENERATE STRUCTURED CLINICAL REPORT
═══════════════════════════════════════════════════════════

Generate a CONCISE, ACTIONABLE report with these sections:

## 1. 📋 Clinical Overview
• One-paragraph patient summary (age, conditions, current treatment)
• Risk assessment based on family history

## 2. 🚫 CONTRAINDICATED MEDICATIONS (CRITICAL)
Based on the patient's CONDITIONS and ALLERGIES, list SPECIFIC drugs to AVOID:
• For each condition, list 3-5 specific drug classes/names that are contraindicated
• Example: "Diabetes → Avoid: Corticosteroids (↑ glucose), Thiazides (glucose intolerance)"
• Example: "Hypertension → Avoid: NSAIDs (↑ BP), Decongestants, MAOIs"
• Include WHY each is contraindicated (brief reason)

## 3. ⚠️ Drug Interaction Warnings
• Specific interactions between CURRENT medications
• Risk level: HIGH/MODERATE/LOW for each
• Monitoring required

## 4. 💊 Medication Optimization
• Current regimen assessment (dosing, frequency gaps)
• Suggested adjustments or additions if warranted
• Lab monitoring schedule (HbA1c, renal, lipids, etc.)

## 5. 🔬 Recommended Investigations
• Essential labs and tests for this patient profile
• Screening due to family history risks
• Timeline for each investigation

## 6. ✅ Key Action Items (Summary Table)
| Priority | Action | Timeframe |
|----------|--------|-----------|
(List 3-5 most important actions)

═══════════════════════════════════════════════════════════
⚠️ REPORT GUIDELINES
═══════════════════════════════════════════════════════════
- Use clinical terminology appropriate for physicians
- Be SPECIFIC with drug names and dosages
- Flag data gaps clearly with [DATA NEEDED]
- Keep each section CONCISE but COMPREHENSIVE
- Do NOT use HTML tags like <br> inside tables. Use commas or semicolons to separate items.
- This is for PHYSICIAN reference only

Generate the report now:
"""
    else:
        # ARABIC REPORT PROMPT (For Patients - Egyptian Colloquial Arabic للعامية المصرية)
        prompt = f"""
أنت مساعد طبي ذكي. مهمتك إنشاء **تقرير صحي للمريض** بالعامية المصرية البسيطة اللي أي حد يفهمها.

⚠️ **مهم جداً:** اكتب بالعامية المصرية مش الفصحى! زي ما حد بيتكلم مع صاحبه في مصر.
مثال: "لازم تبعد عن الحاجات دي" بدل "يجب عليك تجنب"
مثال: "ده هيأثر على صحتك" بدل "هذا سيؤثر على صحتك"

═══════════════════════════════════════════════════════════
بيانات المريض
═══════════════════════════════════════════════════════════
الاسم: {profile.get('name', 'مش محدد')}
السن: {profile.get('age', 'مش محدد')}
النوع: {profile.get('gender', 'مش محدد')}
رقم التليفون: {profile.get('phone', 'مش محدد') if profile.get('phone') else 'مش محدد'}
فصيلة الدم: {blood_type if blood_type != 'N/A' else 'مش محدد'}

الأمراض المزمنة:
{chr(10).join([f"• {c}" for c in conditions]) if conditions else "• مفيش أمراض مسجلة"}

الأدوية الحالية:
{chr(10).join([f"• {m}" for m in medications]) if medications else "• مفيش أدوية مسجلة"}

الحساسية:
{chr(10).join([f"• {a}" for a in allergies]) if allergies else "• مفيش حساسية"}

التاريخ العائلي:
{format_family_history(family_history, "ar")}

═══════════════════════════════════════════════════════════
أنشئ التقرير الصحي للمريض بالعامية المصرية
═══════════════════════════════════════════════════════════

## 1. ملخص حالتك الصحية
• اشرح بالبلدي كده إيه اللي عندك
• ده معناه إيه لصحتك، وخد في اعتبارك فصيلة الدم
• تقييم لمخاطرك بناءً على تاريخ عيلتك المرضي (لو موجود)

## 2. الأكل الممنوع والمسموح (مهم جداً!)
بناءً على أمراضك، اذكر بالتفصيل:

**أكل لازم تبعد عنه خالص:**
• لكل مرض، اذكر 5-7 أنواع أكل ممنوع مع السبب
• مثال: "السكر → ابعد عن: المياه الغازية، العصاير المحلاة، الحلويات، الرز الأبيض كتير، العيش الفينو"
• مثال: "الضغط → ابعد عن: الملح والمخللات، الأكل المعلب، اللانشون والهوت دوج، الفاست فود"

**أكل مفيد ومسموح:**
• قايمة بالأكل الصحي المناسب لحالتك
• مثال: "الخضار الورقي، السمك، المكسرات من غير ملح"

## 3. دواك اليومي
• اشرح كل دوا بطريقة سهلة
• تاخده امتى
• تحذيرات مهمة (مثلاً: متاخدوش على معدة فاضية)

## 4. علامات خطر (روح للدكتور فوراً لو حصلت)
• أعراض خطيرة مرتبطة بأمراضك
• مثال لمريض السكر: "دوخة شديدة، عرق كتير، تنميل في إيديك ورجليك"
• مثال للضغط: "صداع جامد، زغللة في عينك، وجع في صدرك"

## 5. نصايح لحياة صحية
• رياضة مناسبة لحالتك
• نصايح للنوم والراحة
• إزاي تتجنب مضاعفات أمراضك

## 6. متابعتك الدورية
• امتى تزور الدكتور؟
• تحاليل مطلوبة ومواعيدها

═══════════════════════════════════════════════════════════
تعليمات مهمة جداً
═══════════════════════════════════════════════════════════
- اكتب بالعامية المصرية البسيطة، زي ما بتتكلم مع حد عادي
- متستخدمش كلام طبي صعب
- ركز على النصايح العملية اليومية
- استخدم الجداول (Markdown Tables) لتنظيم المعلومات زي الأكل الممنوع والمسموح، والأدوية لتسهيل القراءة
- لا تستخدم أبداً علامات HTML مثل <br> داخل الجداول أو في أي مكان. استخدم الفواصل (،) للفصل بين العناصر
- التقرير ده للمريض نفسه مش للدكتور
- استخدم كلمات زي: "لازم"، "ابعد عن"، "خلي بالك"، "متنساش"

أنشئ التقرير دلوقتي:
"""

    try:
        # Call LLM
        response = llm.invoke(prompt)
        
        # Extract text from response
        if hasattr(response, 'content'):
            return response.content
        return str(response)
        
    except Exception as e:
        logger.error(f"LLM report generation error: {e}")
        # Fallback to basic report
        return generate_basic_report(patient_profile, language)


def generate_basic_report(patient_profile: Dict[str, Any], language: str = "ar") -> str:
    """Generate a basic report without AI if LLM fails."""
    profile = patient_profile.get("profile", {})
    conditions = patient_profile.get("conditions", [])
    medications = patient_profile.get("medications", [])
    allergies = patient_profile.get("allergies", [])
    
    if language == "en":
        report = f"""
═══════════════════════════════════════════════════════════
📋 PATIENT MEDICAL REPORT
═══════════════════════════════════════════════════════════

👤 Demographics:
   Name: {profile.get('name', 'Not specified')}
   Age: {profile.get('age', 'Not specified')}
   Gender: {profile.get('gender', 'Not specified')}

🏥 Chronic Conditions:
{chr(10).join([f"   • {c}" for c in conditions]) if conditions else "   • None documented"}

💊 Current Medications:
{chr(10).join([f"   • {m}" for m in medications]) if medications else "   • None documented"}

⚠️ Allergies:
{chr(10).join([f"   • {a}" for a in allergies]) if allergies else "   • NKDA"}

═══════════════════════════════════════════════════════════
⚠️ Note: Review drug interactions before prescribing
═══════════════════════════════════════════════════════════
"""
    else:
        report = f"""
═══════════════════════════════════════════════════════════
📋 تقرير المريض الطبي
═══════════════════════════════════════════════════════════

👤 البيانات الشخصية:
   الاسم: {profile.get('name', 'غير محدد')}
   العمر: {profile.get('age', 'غير محدد')}
   النوع: {profile.get('gender', 'غير محدد')}

🏥 الأمراض المزمنة:
{chr(10).join([f"   • {c}" for c in conditions]) if conditions else "   • لا توجد أمراض مسجلة"}

💊 الأدوية الحالية:
{chr(10).join([f"   • {m}" for m in medications]) if medications else "   • لا توجد أدوية مسجلة"}

⚠️ الحساسية:
{chr(10).join([f"   • {a}" for a in allergies]) if allergies else "   • لا توجد حساسية مسجلة"}

═══════════════════════════════════════════════════════════
⚠️ تنبيه: يرجى مراجعة التداخلات الدوائية قبل وصف أي علاج جديد
═══════════════════════════════════════════════════════════
"""
    return report.strip()


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/{patient_id}/doctor-report", response_model=DoctorReportResponse, 
            summary="Generate AI Doctor Report")
async def get_doctor_report(patient_id: str, user_role: str = "patient", force_refresh: bool = False):
    """
    Generate AI medical report for doctors.
    
    - **patient_id**: Patient identifier
    - **user_role**: "doctor" for English clinical report, "patient" for Arabic report
    - **force_refresh**: If false, returns saved report if available
    """
    try:
        # Determine language based on role
        language = "en" if user_role.lower() == "doctor" else "ar"
        
        # Load patient profile data
        history_mgr = load_history_manager()
        history = history_mgr.get_patient_history(patient_id)
        
        # Check if we have a saved report and don't need to refresh
        saved_report = history.latest_report_en if language == "en" else history.latest_report_ar
        if not force_refresh and saved_report:
            logger.info(f"Returning SAVED report for patient: {patient_id} (language={language})")
            return DoctorReportResponse(
                status="success",
                patient_id=patient_id,
                report=saved_report,
                generated_at=get_timestamp(),
                profile_based=True
            )
            
        # Get profile data (not chat history)
        patient_data = history.to_dict()
        
        # Check if patient has any data
        if not patient_data.get("conditions") and not patient_data.get("medications") and not patient_data.get("allergies"):
            error_msg = "Insufficient data to generate report. Please add conditions, medications, or allergies." if language == "en" else "لا توجد بيانات كافية لإنشاء التقرير. يرجى إضافة الأمراض أو الأدوية أو الحساسية."
            raise HTTPException(status_code=404, detail=error_msg)
        
        # Generate AI report with language
        logger.info(f"Generating NEW AI doctor report for patient: {patient_id} (language={language})")
        report = generate_ai_doctor_report(patient_data, language=language)
        
        # Save it to database
        if language == "en":
            history.latest_report_en = report
        else:
            history.latest_report_ar = report
            
        # Save record to history array too
        history_mgr.add_record(
            patient_id=patient_id,
            record_type=f"{language}_report",
            content=report,
            source="ai"
        )
        history_mgr.save_patient_history(history)
        
        return DoctorReportResponse(
            status="success",
            patient_id=patient_id,
            report=report,
            generated_at=get_timestamp(),
            profile_based=True
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Doctor report error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{patient_id}/doctor-report/stream", summary="Stream AI Doctor Report (SSE)")
async def stream_doctor_report(patient_id: str, user_role: str = "patient", force_refresh: bool = True, background_tasks: BackgroundTasks = None):
    """
    Stream AI medical report via Server-Sent Events.
    
    - If cached and force_refresh=false, streams cached text in simulated chunks.
    - If force_refresh=true, streams live from LLM.astream().
    """
    try:
        from src.stream_utils import make_metadata_event, make_text_event, make_done_event, sanitize_chunk, stream_text_chunks
    except ImportError:
        from stream_utils import make_metadata_event, make_text_event, make_done_event, sanitize_chunk, stream_text_chunks

    import re
    language = "en" if user_role.lower() == "doctor" else "ar"

    # Load patient profile
    history_mgr = load_history_manager()
    history = history_mgr.get_patient_history(patient_id)

    # Check cached report
    saved_report = history.latest_report_en if language == "en" else history.latest_report_ar
    if not force_refresh and saved_report:
        logger.info(f"Streaming CACHED report for patient: {patient_id}")

        async def cached_generator():
            yield make_metadata_event(label="medical-report", confidence=1.0, model="medical-report")
            async for chunk in stream_text_chunks(saved_report):
                yield chunk

        return StreamingResponse(
            cached_generator(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive"}
        )

    # Build patient data
    patient_data = history.to_dict()
    if not patient_data.get("conditions") and not patient_data.get("medications") and not patient_data.get("allergies"):
        error_msg = "Insufficient data to generate report." if language == "en" else "لا توجد بيانات كافية لإنشاء التقرير."
        raise HTTPException(status_code=404, detail=error_msg)

    # Build prompt (reuse generate_ai_doctor_report logic inline)
    llm = load_llm()
    is_english = language == "en"
    profile = patient_data.get("profile", {})
    conditions = patient_data.get("conditions", [])
    medications = patient_data.get("medications", [])
    allergies = patient_data.get("allergies", [])
    family_history = patient_data.get("family_history", [])
    blood_type = patient_data.get("blood_type", "N/A")

    def format_family_history(fh_list, lang="en"):
        if not fh_list:
            return "• None documented" if lang == "en" else "• لا يوجد تاريخ عائلي مسجل"
        return chr(10).join([f"• {fh.get('relation', 'Unknown')}: {fh.get('condition', 'Unknown')}" for fh in fh_list])

    if is_english:
        prompt = f"""You are a clinical decision support AI generating a physician-oriented medical report.
Name: {profile.get('name', 'N/A')}, Age: {profile.get('age', 'N/A')}, Gender: {profile.get('gender', 'N/A')}, Blood Type: {blood_type}
Conditions: {', '.join(conditions) if conditions else 'None'}
Medications: {', '.join(medications) if medications else 'None'}
Allergies: {', '.join(allergies) if allergies else 'NKDA'}
Family History: {format_family_history(family_history, 'en')}
Generate a structured clinical report with: Clinical Overview, Contraindicated Medications, Drug Interactions, Medication Optimization, Recommended Investigations, and Key Action Items table. Use markdown formatting."""
    else:
        prompt = f"""
أنت مساعد طبي ذكي. مهمتك إنشاء تقرير صحي للمريض بالعامية المصرية البسيطة.
الاسم: {profile.get('name', 'مش محدد')}, السن: {profile.get('age', 'مش محدد')}, النوع: {profile.get('gender', 'مش محدد')}, فصيلة الدم: {blood_type if blood_type != 'N/A' else 'مش محدد'}
الأمراض: {', '.join(conditions) if conditions else 'مفيش'}
الأدوية: {', '.join(medications) if medications else 'مفيش'}
الحساسية: {', '.join(allergies) if allergies else 'مفيش'}
التاريخ العائلي: {format_family_history(family_history, 'ar')}
أنشئ تقرير صحي منظم يشمل: ملخص حالتك الصحية، الأكل الممنوع والمسموح، دواك اليومي، علامات خطر، نصايح لحياة صحية، متابعتك الدورية. اكتب بالعامية المصرية."""

    logger.info(f"Streaming NEW AI doctor report for patient: {patient_id} (language={language})")

    async def live_generator():
        yield make_metadata_event(label="medical-report", confidence=1.0, model="medical-report")
        full_text = []
        in_think_block = False
        think_seen = False
        try:
            async for chunk in llm.astream(prompt):
                token = chunk.content if hasattr(chunk, 'content') else str(chunk)
                if not token:
                    continue

                # Handle <think> blocks
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
                                clean = sanitize_chunk(after)
                                if clean:
                                    full_text.append(clean)
                                    yield make_text_event(clean)
                        continue

                clean = sanitize_chunk(token)
                if clean:
                    full_text.append(clean)
                    yield make_text_event(clean)

        except Exception as e:
            logger.error(f"LLM streaming error: {e}")
            fallback = generate_basic_report(patient_data, language)
            full_text.append(fallback)
            yield make_text_event(fallback)

        yield make_done_event()

        # Save report in background
        assembled = "".join(full_text)
        if assembled.strip():
            try:
                if language == "en":
                    history.latest_report_en = assembled
                else:
                    history.latest_report_ar = assembled
                history_mgr.add_record(
                    patient_id=patient_id,
                    record_type=f"{language}_report",
                    content=assembled,
                    source="ai"
                )
                history_mgr.save_patient_history(history)
            except Exception as save_err:
                logger.error(f"Failed to save streamed report: {save_err}")

    return StreamingResponse(
        live_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive"}
    )


@router.get("/{patient_id}/doctor-report/pdf", summary="Download Doctor Report as PDF")
async def get_doctor_report_pdf(patient_id: str, user_role: str = "patient"):
    """
    Download medical report as PDF.
    
    - **patient_id**: Patient identifier
    - **user_role**: "doctor" for English clinical PDF, "patient" for Arabic PDF
    """
    try:
        # First generate the report with the correct language
        report_response = await get_doctor_report(patient_id, user_role)
        
        # Load PDF generator
        from src.pdf_generator import generate_pdf_report
        
        # Get full patient data
        history_mgr = load_history_manager()
        history = history_mgr.get_patient_history(patient_id)
        patient_dict = history.to_dict()
        patient_name = patient_dict.get("profile", {}).get("name", "Patient" if user_role == "doctor" else "مريض")
        
        # Determine language from user_role
        language = "en" if user_role == "doctor" else "ar"
        
        # Generate PDF with correct text direction and full patient data
        pdf_path = generate_pdf_report(
            analysis=report_response.report,
            patient_name=patient_name,
            patient_age=patient_dict.get("profile", {}).get("age"),
            language=language,
            patient_data=patient_dict
        )
        
        # Use language-appropriate filename
        lang_suffix = "en" if user_role == "doctor" else "ar"
        logger.info(f"Doctor report PDF generated ({lang_suffix}): {pdf_path}")
        
        return FileResponse(
            path=pdf_path,
            filename=f"doctor_report_{patient_id}_{lang_suffix}_{datetime.now().strftime('%Y%m%d')}.pdf",
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=doctor_report_{patient_id}_{lang_suffix}.pdf"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Doctor report PDF error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{patient_id}/quick-summary", summary="Quick Patient Summary")
async def get_quick_summary(patient_id: str):
    """
    ملخص سريع للمريض (بدون AI).
    مفيد للعرض السريع في الـ dashboard.
    """
    try:
        history_mgr = load_history_manager()
        history = history_mgr.get_patient_history(patient_id)
        data = history.to_dict()
        
        return {
            "status": "success",
            "patient_id": patient_id,
            "name": data.get("profile", {}).get("name", "غير محدد"),
            "conditions_count": len(data.get("conditions", [])),
            "medications_count": len(data.get("medications", [])),
            "allergies_count": len(data.get("allergies", [])),
            "has_warnings": len(data.get("conditions", [])) > 0 or len(data.get("allergies", [])) > 0,
            "conditions": data.get("conditions", []),
            "allergies": data.get("allergies", []),
            "medications": data.get("medications", []),
            "timestamp": get_timestamp()
        }
        
    except Exception as e:
        logger.error(f"Quick summary error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
