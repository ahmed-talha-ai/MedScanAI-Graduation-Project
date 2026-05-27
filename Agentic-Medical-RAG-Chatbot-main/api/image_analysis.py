"""
MediScan - Image Analysis API Router
=====================================
Medical image analysis endpoints.
"""

import os
import sys
import shutil
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any, List

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__)), 'src'))

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse, StreamingResponse
from src.stream_utils import stream_text_chunks, make_metadata_event, make_text_event, make_done_event
from .models import ImageAnalysisResponse, PDFReportRequest

logger = logging.getLogger(__name__)

router = APIRouter()


# ============================================================================
# LAZY LOADING
# ============================================================================

_tools_loaded = False
_analyze_tool = None
_config_loaded = False
_uploaded_images_dir = None
_cache_loaded = False
_cache_module = None
_pdf_loaded = False
_pdf_generator = None
_history_loaded = False
_history_manager = None

_image_proc_loaded = False
_image_processor = None


def load_cache() -> Dict[str, Any]:
    """Lazy load the cache module."""
    global _cache_loaded, _cache_module
    if not _cache_loaded:
        logger.info("🔄 Loading cache module...")
        from src.cache import (
            get_cached_image_analysis, cache_image_analysis,
            get_all_cache_stats, clear_all_caches
        )
        _cache_module = {
            "get_image": get_cached_image_analysis,
            "set_image": cache_image_analysis,
            "stats": get_all_cache_stats,
            "clear": clear_all_caches
        }
        _cache_loaded = True
        logger.info("✅ Cache module loaded")
    return _cache_module


def load_tools():
    """Lazy load the tools module."""
    global _tools_loaded, _analyze_tool
    if not _tools_loaded:
        logger.info("🔄 Loading analysis tools...")
        from src.tools import analyze_medical_image_tool
        _analyze_tool = analyze_medical_image_tool
        _tools_loaded = True
        logger.info("✅ Tools loaded successfully")
    return _analyze_tool


def load_config() -> Path:
    """Lazy load config for paths."""
    global _config_loaded, _uploaded_images_dir
    if not _config_loaded:
        from src.config import UPLOADED_IMAGES_DIR
        _uploaded_images_dir = UPLOADED_IMAGES_DIR
        _config_loaded = True
    return _uploaded_images_dir


def load_pdf_generator() -> Dict[str, Any]:
    """Lazy load the PDF generator."""
    global _pdf_loaded, _pdf_generator
    if not _pdf_loaded:
        logger.info("🔄 Loading PDF generator...")
        from src.pdf_generator import (
            MedicalReportGenerator,
            generate_pdf_report_file
        )
        _pdf_generator = {
            "generator": MedicalReportGenerator(),
            "generate_file": generate_pdf_report_file
        }
        _pdf_loaded = True
        logger.info("✅ PDF generator loaded")
    return _pdf_generator


def load_history_manager() -> Dict[str, Any]:
    """Lazy load the medical history manager."""
    global _history_loaded, _history_manager
    if not _history_loaded:
        logger.info("🔄 Loading medical history manager...")
        from src.medical_history import get_history_manager, process_analysis_for_patient
        _history_manager = {
            "manager": get_history_manager(),
            "process": process_analysis_for_patient
        }
        _history_loaded = True
        logger.info("✅ Medical history manager loaded")
    return _history_manager



def load_image_processor() -> Dict[str, Any]:
    """Lazy load the image processor."""
    global _image_proc_loaded, _image_processor
    if not _image_proc_loaded:
        logger.info("🔄 Loading image processor...")
        from src.image_processing import auto_compress_if_needed
        _image_processor = {
            "auto_compress": auto_compress_if_needed
        }
        _image_proc_loaded = True
        logger.info("✅ Image processor loaded")
    return _image_processor


def get_timestamp() -> str:
    """Get current timestamp in ISO format."""
    return datetime.now().isoformat()


# ============================================================================
# SINGLE IMAGE ANALYSIS ENDPOINTS
# ============================================================================

@router.post("/analyze/stream", summary="Stream Medical Image Analysis (SSE)")
async def stream_analyze_image(
    file: UploadFile = File(..., description="الصورة الطبية للتحليل"),
    image_type: Optional[str] = Form("auto", description="نوع الصورة (auto, lab_report, xray)"),
    symptoms: Optional[str] = Form(None, description="الأعراض (اختياري)"),
    user_role: Optional[str] = Form("patient", description="Role: 'doctor' or 'patient'")
):
    try:
        # Load and save file (simplified for stream)
        filename = file.filename or "unknown.jpg"
        ext = Path(filename).suffix.lower()
        uploaded_images_dir = load_config()
        uploaded_images_dir.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        save_path = uploaded_images_dir / f"api_upload_{timestamp}{ext}"
        
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        analyze_tool = load_tools()
        is_doctor = user_role.lower() == "doctor"
        
        analysis_result = analyze_tool.invoke({
            "image_path": str(save_path),
            "image_type": image_type or "auto",
            "patient_symptoms": symptoms,
            "analysis_language": "en" if is_doctor else "ar"
        })
        
        import re
        if isinstance(analysis_result, str):
            analysis_result = re.sub(r'<think>[\s\S]*?(?:</think>|$)', '', analysis_result).strip()
            analysis_result = re.sub(r'<br\s*/?>', '\n', analysis_result)
            
        async def stream_generator():
            yield make_metadata_event("Image Analysis", 100.0, "gemini-1.5-pro")
            async for chunk in stream_text_chunks(analysis_result):
                yield chunk
                
        return StreamingResponse(stream_generator(), media_type="text/event-stream")
        
    except Exception as e:
        async def error_stream():
            yield make_text_event(f"Error analyzing image: {str(e)}")
            yield make_done_event()
        return StreamingResponse(error_stream(), media_type="text/event-stream")



@router.post("/analyze", response_model=ImageAnalysisResponse, summary="Analyze Medical Image")
async def analyze_image(
    file: UploadFile = File(..., description="الصورة الطبية للتحليل"),
    image_type: Optional[str] = Form("auto", description="نوع الصورة (auto, lab_report, xray)"),
    symptoms: Optional[str] = Form(None, description="الأعراض (اختياري)"),
    user_role: Optional[str] = Form("patient", description="Role: 'doctor' (English/clinical) or 'patient' (Arabic/simple)")
):
    """
    تحليل صورة طبية (تحاليل، أشعة، تقارير).
    
    - **file**: ملف الصورة (JPG, PNG, PDF)
    - **image_type**: نوع الصورة (اختياري)
    - **symptoms**: الأعراض المصاحبة (اختياري)
    - **user_role**: 'doctor' (English/clinical) or 'patient' (Arabic/simple)
    """
    try:
        # Get role
        role = (user_role or "patient").lower()
        is_doctor = role == "doctor"
        
        # Validate file
        if not file:
            raise HTTPException(status_code=400, detail="No image uploaded." if is_doctor else "مفيش صورة مرفوعة")
        
        # Check file extension
        filename = file.filename or "unknown.jpg"
        ext = Path(filename).suffix.lower()
        allowed_extensions = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.pdf', '.webp']
        
        if ext not in allowed_extensions:
            error_msg = f"Unsupported file format: {ext}. Supported: {', '.join(allowed_extensions)}" if is_doctor else f"صيغة الملف مش مدعومة: {ext}. الصيغ المدعومة: {', '.join(allowed_extensions)}"
            raise HTTPException(status_code=400, detail=error_msg)
        
        # Load config for paths
        uploaded_images_dir = load_config()
        uploaded_images_dir.mkdir(parents=True, exist_ok=True)
        
        # Save uploaded file
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        save_filename = f"api_upload_{timestamp}{ext}"
        save_path = uploaded_images_dir / save_filename
        
        logger.info(f"Saving uploaded image: {save_path}")
        
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Compress image if needed
        try:
            img_proc = load_image_processor()
            compress_result = img_proc["auto_compress"](str(save_path))
            if compress_result.get("status") == "compressed":
                save_path = Path(compress_result["compressed_path"])
                logger.info(f"Image compressed: {compress_result['savings']['percentage']}% smaller")
        except Exception as comp_err:
            logger.warning(f"Image compression skipped: {comp_err}")
        
        # Check cache first (only for patient mode)
        if role == "patient":
            cache = load_cache()
            cached_analysis = cache["get_image"](str(save_path))
            
            if cached_analysis:
                logger.info(f"Cache HIT for image: {save_path}")
                return ImageAnalysisResponse(
                    status="success",
                    analysis=cached_analysis,
                    image_path=str(save_path),
                    timestamp=get_timestamp(),
                    cached=True
                )
        
        # Load analysis tool
        analyze_tool = load_tools()
        
        # Perform analysis with role-specific language
        logger.info(f"Analyzing image ({role}): {save_path}")
        
        analysis_result = analyze_tool.invoke({
            "image_path": str(save_path),
            "image_type": image_type or "auto",
            "patient_symptoms": symptoms,
            "analysis_language": "en" if is_doctor else "ar"
        })
        
        # Clean up <think> blocks and HTML tags for all frontends
        import re
        if isinstance(analysis_result, str):
            analysis_result = re.sub(r'<think>[\s\S]*?(?:</think>|$)', '', analysis_result).strip()
            analysis_result = re.sub(r'<br\s*/?>', '\n', analysis_result)
        
        # Cache the result (only for patient mode)
        if role == "patient":
            cache = load_cache()
            cache["set_image"](str(save_path), analysis_result)
        
        logger.info(f"Analysis complete ({role}): {len(analysis_result)} chars")
        
        return ImageAnalysisResponse(
            status="success",
            analysis=analysis_result,
            image_path=str(save_path),
            timestamp=get_timestamp(),
            cached=False
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Image analysis error: {e}")
        error_msg = f"Analysis error: {str(e)}" if is_doctor else f"حصل خطأ في التحليل: {str(e)}"
        raise HTTPException(status_code=500, detail=error_msg)


@router.post("/analyze-with-history", summary="Analyze Image and Save to History")
async def analyze_with_patient_history(
    patient_id: str = Form(..., description="معرف المريض"),
    file: UploadFile = File(..., description="الصورة الطبية"),
    symptoms: Optional[str] = Form(None, description="الأعراض")
):
    """
    تحليل صورة طبية وإضافة النتائج للتاريخ المرضي تلقائياً.
    يستخرج التحذيرات والمعلومات المهمة ويضيفها للسجل.
    """
    try:
        # First, analyze the image
        result = await analyze_image(file=file, symptoms=symptoms)
        
        if result.status != "success":
            return result
        
        # Add to patient history
        history_mgr = load_history_manager()
        history_mgr["process"](
            patient_id=patient_id,
            analysis=result.analysis,
            image_path=result.image_path
        )
        
        return {
            "status": "success",
            "analysis": result.analysis,
            "image_path": result.image_path,
            "patient_id": patient_id,
            "saved_to_history": True,
            "timestamp": get_timestamp()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analyze with history error: {e}")
        raise HTTPException(status_code=500, detail=str(e))



# ============================================================================
# PDF REPORT GENERATION
# ============================================================================

@router.post("/generate-report", summary="Generate PDF Report")
async def generate_pdf_report_endpoint(request: PDFReportRequest):
    """
    إنشاء تقرير PDF من نتائج التحليل.
    
    - **analysis**: نص التحليل الطبي
    - **patient_name**: اسم المريض (اختياري)
    - **patient_age**: عمر المريض (اختياري)
    
    Returns: PDF file download
    """
    try:
        if not request.analysis or not request.analysis.strip():
            raise HTTPException(
                status_code=400,
                detail="نص التحليل فاضي"
            )
        
        # Load PDF generator
        pdf = load_pdf_generator()
        
        # Generate PDF file
        logger.info("Generating PDF report...")
        
        pdf_path = pdf["generate_file"](
            analysis=request.analysis,
            patient_name=request.patient_name,
            patient_age=request.patient_age
        )
        
        logger.info(f"PDF generated: {pdf_path}")
        
        # Return file for download
        return FileResponse(
            path=pdf_path,
            filename=Path(pdf_path).name,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={Path(pdf_path).name}"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"PDF generation error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"حصل خطأ في إنشاء التقرير: {str(e)}"
        )


# ============================================================================
# CACHE MANAGEMENT ENDPOINTS
# ============================================================================

@router.get("/cache/stats", summary="Get Cache Statistics")
async def get_cache_stats():
    """
    Get statistics for all caches (chat and image).
    
    Returns:
    - Cache hit/miss rates
    - Number of cached entries
    - TTL settings
    """
    try:
        cache = load_cache()
        stats = cache["stats"]()
        return {
            "status": "success",
            "cache_stats": stats,
            "timestamp": get_timestamp()
        }
    except Exception as e:
        logger.error(f"Error getting cache stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/cache/clear", summary="Clear All Caches")
async def clear_caches():
    """
    Clear all cached data (chat and image caches).
    
    ⚠️ Warning: This will clear all cached responses.
    """
    try:
        cache = load_cache()
        result = cache["clear"]()
        return {
            "status": "success",
            "message": "All caches cleared",
            "cleared": result,
            "timestamp": get_timestamp()
        }
    except Exception as e:
        logger.error(f"Error clearing caches: {e}")
        raise HTTPException(status_code=500, detail=str(e))
