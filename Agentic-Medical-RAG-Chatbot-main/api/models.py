"""
Shared Pydantic Models for MediScan API
"""

from typing import Optional, List
from pydantic import BaseModel, Field


# ============================================================================
# CHAT MODELS
# ============================================================================

class ChatRequest(BaseModel):
    message: str = Field(..., description="رسالة المستخدم")
    session_id: Optional[str] = Field(None, description="معرف الجلسة للحفاظ على المحادثة")
    patient_id: Optional[str] = Field(None, description="معرف المريض لحفظ المحادثة في التاريخ المرضي")
    user_role: str = Field("patient", description="Role: 'doctor' (English/clinical) or 'patient' (Arabic/simple)")

class ChatResponse(BaseModel):
    status: str
    session_id: str
    response: str
    timestamp: str
    cached: bool = False


# ============================================================================
# IMAGE ANALYSIS MODELS
# ============================================================================

class ImageAnalysisResponse(BaseModel):
    status: str
    analysis: str
    image_path: Optional[str] = None
    timestamp: str
    cached: bool = False

class CompareImagesRequest(BaseModel):
    comparison_type: str = Field("before_after", description="نوع المقارنة (before_after, compare)")
    symptoms: Optional[str] = Field(None, description="الأعراض")


# ============================================================================
# GENERAL MODELS
# ============================================================================

class ClearSessionRequest(BaseModel):
    session_id: str = Field(..., description="معرف الجلسة لمسحها")

class HealthResponse(BaseModel):
    status: str
    message: str
    timestamp: str

class PDFReportRequest(BaseModel):
    analysis: str = Field(..., description="نص التحليل الطبي")
    patient_name: Optional[str] = Field(None, description="اسم المريض (اختياري)")
    patient_age: Optional[str] = Field(None, description="عمر المريض (اختياري)")


# ============================================================================
# PATIENT / MEDICAL HISTORY MODELS
# ============================================================================

class PatientProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, description="اسم المريض")
    age: Optional[str] = Field(None, description="عمر المريض")
    gender: Optional[str] = Field(None, description="النوع")
    phone: Optional[str] = Field(None, description="رقم الهاتف")

class AddMedicalRecord(BaseModel):
    record_type: str = Field(..., description="نوع السجل (analysis, warning, medication, diagnosis)")
    content: str = Field(..., description="محتوى السجل")
    severity: Optional[str] = Field("info", description="مستوى الخطورة (info, warning, critical)")

class AddMedication(BaseModel):
    medication_name: str = Field(..., description="اسم الدواء")
    dosage: Optional[str] = Field(None, description="الجرعة")
    frequency: Optional[str] = Field(None, description="مرات الاستخدام")
    notes: Optional[str] = Field(None, description="ملاحظات")

class AddMedicationsRequest(BaseModel):
    medications: List[str] = Field(..., description="قائمة الأدوية")

class AddCondition(BaseModel):
    condition: str = Field(..., description="الحالة المرضية")

class AddConditionsRequest(BaseModel):
    conditions: List[str] = Field(..., description="قائمة الأمراض المزمنة")

class AddFamilyHistory(BaseModel):
    relation: str = Field(..., description="صلة القرابة (father, mother, sibling, grandparent)")
    condition: str = Field(..., description="الحالة المرضية للقريب")
    notes: Optional[str] = Field(None, description="ملاحظات إضافية")

class AddFamilyHistoriesRequest(BaseModel):
    family_histories: List[str] = Field(..., description="قائمة الأمراض الوراثية")

class AddAllergiesRequest(BaseModel):
    allergies: List[str] = Field(..., description="قائمة الحساسيات")
