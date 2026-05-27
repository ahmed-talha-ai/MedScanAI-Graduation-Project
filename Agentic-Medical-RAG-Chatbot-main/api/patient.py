"""
MediScan - Patient Management API Router
=========================================
Patient profile and medical history endpoints.
"""

import os
import sys
import logging
from datetime import datetime
from typing import Dict, Any

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__)), 'src'))

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from .models import (
    PatientProfileUpdate, AddMedicalRecord, 
    AddMedication, AddCondition, AddFamilyHistory,
    AddConditionsRequest, AddMedicationsRequest,
    AddAllergiesRequest, AddFamilyHistoriesRequest
)

logger = logging.getLogger(__name__)

router = APIRouter()


# ============================================================================
# LAZY LOADING
# ============================================================================

_history_loaded = False
_history_manager = None


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


def get_timestamp() -> str:
    """Get current timestamp in ISO format."""
    return datetime.now().isoformat()


# ============================================================================
# PATIENT HISTORY ENDPOINTS
# ============================================================================

@router.get("/{patient_id}/history", summary="Get Patient History")
async def get_patient_history(patient_id: str):
    """
    الحصول على التاريخ المرضي للمريض.
    
    - **patient_id**: معرف المريض من الـ backend
    """
    try:
        history_mgr = load_history_manager()
        history = history_mgr["manager"].get_patient_history(patient_id)
        
        return {
            "status": "success",
            "patient_id": patient_id,
            "history": history.to_dict(),
            "timestamp": get_timestamp()
        }
        
    except Exception as e:
        logger.error(f"Get history error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{patient_id}/summary", summary="Get Patient Summary")
async def get_patient_summary(patient_id: str):
    """
    الحصول على ملخص التاريخ المرضي.
    """
    try:
        history_mgr = load_history_manager()
        summary = history_mgr["manager"].get_patient_summary(patient_id)
        
        return {
            "status": "success",
            **summary,
            "timestamp": get_timestamp()
        }
        
    except Exception as e:
        logger.error(f"Get summary error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{patient_id}/warnings", summary="Get Active Warnings")
async def get_patient_warnings(patient_id: str):
    """
    الحصول على التحذيرات النشطة للمريض.
    """
    try:
        history_mgr = load_history_manager()
        warnings = history_mgr["manager"].get_active_warnings(patient_id)
        
        return {
            "status": "success",
            "patient_id": patient_id,
            "warnings_count": len(warnings),
            "warnings": warnings,
            "timestamp": get_timestamp()
        }
        
    except Exception as e:
        logger.error(f"Get warnings error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{patient_id}/profile", summary="Update Patient Profile")
async def update_patient_profile(patient_id: str, profile: PatientProfileUpdate):
    """
    تحديث بيانات المريض.
    """
    try:
        history_mgr = load_history_manager()
        history_mgr["manager"].update_profile(
            patient_id=patient_id,
            name=profile.name,
            age=profile.age,
            gender=profile.gender,
            phone=profile.phone
        )
        
        return {
            "status": "success",
            "message": "تم تحديث البيانات",
            "patient_id": patient_id,
            "timestamp": get_timestamp()
        }
        
    except Exception as e:
        logger.error(f"Update profile error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{patient_id}/record", summary="Add Medical Record")
async def add_patient_record(patient_id: str, record: AddMedicalRecord):
    """
    إضافة سجل طبي للمريض.
    """
    try:
        history_mgr = load_history_manager()
        history_mgr["manager"].add_record(
            patient_id=patient_id,
            record_type=record.record_type,
            content=record.content,
            severity=record.severity or "info"
        )
        
        return {
            "status": "success",
            "message": "تم إضافة السجل",
            "patient_id": patient_id,
            "timestamp": get_timestamp()
        }
        
    except Exception as e:
        logger.error(f"Add record error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{patient_id}/medication", summary="Add Medication")
async def add_patient_medication(patient_id: str, medication: AddMedication):
    """
    إضافة دواء للمريض.
    """
    try:
        history_mgr = load_history_manager()
        history_mgr["manager"].add_medication(
            patient_id=patient_id,
            medication_name=medication.medication_name,
            dosage=medication.dosage,
            frequency=medication.frequency,
            notes=medication.notes
        )
        
        return {
            "status": "success",
            "message": f"تم إضافة الدواء: {medication.medication_name}",
            "patient_id": patient_id,
            "timestamp": get_timestamp()
        }
        
    except Exception as e:
        logger.error(f"Add medication error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{patient_id}/medications", summary="Add Multiple Medications")
async def add_patient_medications(patient_id: str, request: AddMedicationsRequest):
    """
    إضافة قائمة أدوية للمريض (Batch).
    """
    try:
        history_mgr = load_history_manager()
        for med_name in request.medications:
            history_mgr["manager"].add_medication(
                patient_id=patient_id,
                medication_name=med_name
            )
        
        return {
            "status": "success",
            "message": f"تم إضافة {len(request.medications)} أدوية",
            "patient_id": patient_id,
            "timestamp": get_timestamp()
        }
    except Exception as e:
        logger.error(f"Add medications batch error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{patient_id}/condition", summary="Add Medical Condition")
async def add_patient_condition(patient_id: str, condition: AddCondition):
    """
    إضافة حالة مرضية للمريض.
    """
    try:
        history_mgr = load_history_manager()
        history_mgr["manager"].add_condition(patient_id, condition.condition)
        
        return {
            "status": "success",
            "message": f"تم تسجيل الحالة: {condition.condition}",
            "patient_id": patient_id,
            "timestamp": get_timestamp()
        }
        
    except Exception as e:
        logger.error(f"Add condition error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{patient_id}/conditions", summary="Add Multiple Conditions")
async def add_patient_conditions(patient_id: str, request: AddConditionsRequest):
    """
    إضافة قائمة أمراض مزمنة للمريض (Batch).
    """
    try:
        history_mgr = load_history_manager()
        for condition in request.conditions:
            history_mgr["manager"].add_condition(patient_id, condition)
        
        return {
            "status": "success",
            "message": f"تم إضافة {len(request.conditions)} حالات",
            "patient_id": patient_id,
            "timestamp": get_timestamp()
        }
    except Exception as e:
        logger.error(f"Add conditions batch error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{patient_id}/family-history", summary="Add Family History")
async def add_patient_family_history(patient_id: str, family_history: AddFamilyHistory):
    """
    إضافة تاريخ عائلي مرضي للمريض.
    
    - **relation**: صلة القرابة (father, mother, sibling, grandparent)
    - **condition**: الحالة المرضية
    - **notes**: ملاحظات إضافية (اختياري)
    """
    try:
        history_mgr = load_history_manager()
        history_mgr["manager"].add_family_history(
            patient_id=patient_id,
            relation=family_history.relation,
            condition=family_history.condition,
            notes=family_history.notes
        )
        
        return {
            "status": "success",
            "message": f"تم تسجيل التاريخ العائلي: {family_history.relation} - {family_history.condition}",
            "patient_id": patient_id,
            "timestamp": get_timestamp()
        }
        
    except Exception as e:
        logger.error(f"Add family history error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{patient_id}/family-histories", summary="Add Multiple Family Histories")
async def add_patient_family_histories(patient_id: str, request: AddFamilyHistoriesRequest):
    """
    إضافة قائمة تاريخ عائلي للمريض (Batch).
    """
    try:
        history_mgr = load_history_manager()
        for condition in request.family_histories:
            history_mgr["manager"].add_family_history(
                patient_id=patient_id,
                relation="Unknown",
                condition=condition
            )
        
        return {
            "status": "success",
            "message": f"تم إضافة {len(request.family_histories)} تاريخ عائلي",
            "patient_id": patient_id,
            "timestamp": get_timestamp()
        }
    except Exception as e:
        logger.error(f"Add family histories batch error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{patient_id}/allergies", summary="Add Multiple Allergies")
async def add_patient_allergies(patient_id: str, request: AddAllergiesRequest):
    """
    إضافة قائمة حساسيات للمريض (Batch).
    """
    try:
        history_mgr = load_history_manager()
        for allergy in request.allergies:
            history_mgr["manager"].add_allergy(patient_id, allergy)
        
        return {
            "status": "success",
            "message": f"تم إضافة {len(request.allergies)} حساسيات",
            "patient_id": patient_id,
            "timestamp": get_timestamp()
        }
    except Exception as e:
        logger.error(f"Add allergies batch error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{patient_id}/history", summary="Delete Patient History")
async def delete_patient_history(patient_id: str):
    """
    حذف التاريخ المرضي للمريض.
    ⚠️ هذا الإجراء لا يمكن التراجع عنه.
    """
    try:
        history_mgr = load_history_manager()
        deleted = history_mgr["manager"].delete_patient_history(patient_id)
        
        if deleted:
            return {
                "status": "success",
                "message": "تم حذف التاريخ المرضي",
                "patient_id": patient_id,
                "timestamp": get_timestamp()
            }
        else:
            raise HTTPException(status_code=404, detail="المريض غير موجود")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete history error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{patient_id}/history/pdf", summary="Download History as PDF")
async def get_patient_history_pdf(patient_id: str):
    """
    تحميل التاريخ المرضي كملف PDF.
    
    - **patient_id**: معرف المريض
    
    Returns: PDF file download
    """
    try:
        # Get patient history
        history_mgr = load_history_manager()
        history = history_mgr["manager"].get_patient_history(patient_id)
        
        # Check if patient has data
        history_dict = history.to_dict()
        if not history_dict.get("records") and not history_dict.get("medications"):
            raise HTTPException(
                status_code=404, 
                detail="مفيش تاريخ مرضي للمريض ده"
            )
        
        # Generate PDF
        from src.pdf_generator import generate_patient_history_pdf
        pdf_path = generate_patient_history_pdf(history_dict)
        
        logger.info(f"Patient history PDF generated: {pdf_path}")
        
        # Return PDF file
        return FileResponse(
            path=pdf_path,
            filename=f"patient_{patient_id}_history.pdf",
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=patient_{patient_id}_history.pdf"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Patient history PDF error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
