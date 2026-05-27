# 📋 MediScan API Endpoints - Complete Reference

> دليل شامل ومفصل لكل الـ APIs مع الـ Inputs والـ Outputs

**Base URL:** `http://localhost:8000`

---

# 📑 Table of Contents

1. [Patient Management](#-patient-management)
2. [Doctor Reports](#-doctor-reports)
3. [Image Analysis](#️-image-analysis)
4. [Chat](#-chat)
5. [System Endpoints](#-system-endpoints)

---

# 👤 Patient Management

## 1. Get Patient History

**Endpoint:**
```
GET /patient/{patient_id}/history
```

**Description:** جلب التاريخ المرضي الكامل للمريض

### Inputs

| Parameter | Type | Location | Required | Description |
|-----------|------|----------|----------|-------------|
| `patient_id` | string | URL Path | ✅ Yes | معرف المريض الفريد |

### Success Response (200 OK)

```json
{
  "status": "success",
  "patient_id": "patient_123",
  "data": {
    "profile": {
      "name": "أحمد محمد",
      "age": "45",
      "gender": "male",
      "phone": "01012345678",
      "created_at": "2026-02-09T14:00:00"
    },
    "conditions": [
      "Diabetes Type 2",
      "Hypertension"
    ],
    "medications": [
      {
        "name": "Metformin",
        "dosage": "1000mg",
        "frequency": "twice daily",
        "added_at": "2026-02-09T14:00:00"
      }
    ],
    "allergies": [
      "Penicillin",
      "Sulfa drugs"
    ],
    "family_history": [
      {
        "relation": "father",
        "condition": "Heart Disease",
        "notes": "توفي في سن 65"
      }
    ],
    "medical_records": []
  }
}
```

### Error Response (404 Not Found)

```json
{
  "status": "error",
  "message": "Patient not found",
  "patient_id": "patient_123"
}
```

### cURL Example

```bash
curl -X GET "http://localhost:8000/patient/patient_123/history"
```

---

## 2. Delete Patient History

**Endpoint:**
```
DELETE /patient/{patient_id}/history
```

**Description:** حذف كل بيانات المريض نهائياً ⚠️

### Inputs

| Parameter | Type | Location | Required | Description |
|-----------|------|----------|----------|-------------|
| `patient_id` | string | URL Path | ✅ Yes | معرف المريض |

### Success Response (200 OK)

```json
{
  "status": "success",
  "message": "Patient history deleted successfully",
  "patient_id": "patient_123"
}
```

### cURL Example

```bash
curl -X DELETE "http://localhost:8000/patient/patient_123/history"
```

---

## 3. Get Patient Summary

**Endpoint:**
```
GET /patient/{patient_id}/summary
```

**Description:** ملخص سريع لحالة المريض

### Inputs

| Parameter | Type | Location | Required | Description |
|-----------|------|----------|----------|-------------|
| `patient_id` | string | URL Path | ✅ Yes | معرف المريض |

### Success Response (200 OK)

```json
{
  "status": "success",
  "patient_id": "patient_123",
  "summary": {
    "name": "أحمد محمد",
    "age": "45",
    "conditions_count": 2,
    "medications_count": 3,
    "allergies_count": 1,
    "last_updated": "2026-02-09T14:00:00"
  }
}
```

### cURL Example

```bash
curl -X GET "http://localhost:8000/patient/patient_123/summary"
```

---

## 4. Get Patient Warnings

**Endpoint:**
```
GET /patient/{patient_id}/warnings
```

**Description:** التحذيرات النشطة (تفاعلات دوائية، حساسية)

### Inputs

| Parameter | Type | Location | Required | Description |
|-----------|------|----------|----------|-------------|
| `patient_id` | string | URL Path | ✅ Yes | معرف المريض |

### Success Response (200 OK)

```json
{
  "status": "success",
  "patient_id": "patient_123",
  "warnings": [
    {
      "type": "allergy",
      "severity": "high",
      "message": "Patient is allergic to Penicillin"
    },
    {
      "type": "drug_interaction",
      "severity": "medium",
      "message": "Metformin may interact with contrast dye"
    }
  ]
}
```

### cURL Example

```bash
curl -X GET "http://localhost:8000/patient/patient_123/warnings"
```

---

## 5. Update Patient Profile

**Endpoint:**
```
POST /patient/{patient_id}/profile
```

**Description:** إنشاء أو تحديث البيانات الأساسية للمريض

### Inputs

| Parameter | Type | Location | Required | Description |
|-----------|------|----------|----------|-------------|
| `patient_id` | string | URL Path | ✅ Yes | معرف المريض |
| `name` | string | Body JSON | ❌ No | اسم المريض |
| `age` | string | Body JSON | ❌ No | السن |
| `gender` | string | Body JSON | ❌ No | النوع (male/female) |
| `phone` | string | Body JSON | ❌ No | رقم التليفون |

### Request Body

```json
{
  "name": "أحمد محمد علي",
  "age": "45",
  "gender": "male",
  "phone": "01012345678"
}
```

### Success Response (200 OK)

```json
{
  "status": "success",
  "message": "Profile updated successfully",
  "patient_id": "patient_123",
  "profile": {
    "name": "أحمد محمد علي",
    "age": "45",
    "gender": "male",
    "phone": "01012345678",
    "updated_at": "2026-02-09T14:00:00"
  }
}
```

### cURL Example

```bash
curl -X POST "http://localhost:8000/patient/patient_123/profile" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "أحمد محمد علي",
    "age": "45",
    "gender": "male",
    "phone": "01012345678"
  }'
```

---

## 6. Add Medical Record

**Endpoint:**
```
POST /patient/{patient_id}/record
```

**Description:** إضافة سجل طبي (نتيجة تحليل، زيارة، إلخ)

### Inputs

| Parameter | Type | Location | Required | Description |
|-----------|------|----------|----------|-------------|
| `patient_id` | string | URL Path | ✅ Yes | معرف المريض |
| `record_type` | string | Body JSON | ✅ Yes | نوع السجل |
| `data` | object | Body JSON | ✅ Yes | بيانات السجل |

### Valid Record Types

| Type | Description |
|------|-------------|
| `lab_result` | نتيجة تحليل معملي |
| `visit` | زيارة طبية |
| `imaging` | أشعة أو صور طبية |
| `prescription` | وصفة طبية |
| `note` | ملاحظة طبية |

### Request Body

```json
{
  "record_type": "lab_result",
  "data": {
    "test_name": "HbA1c",
    "value": "7.2",
    "unit": "%",
    "reference_range": "4.0 - 5.6%",
    "date": "2026-02-09",
    "lab_name": "Alpha Lab"
  }
}
```

### Success Response (200 OK)

```json
{
  "status": "success",
  "message": "Record added successfully",
  "record_id": "rec_abc123"
}
```

### cURL Example

```bash
curl -X POST "http://localhost:8000/patient/patient_123/record" \
  -H "Content-Type: application/json" \
  -d '{
    "record_type": "lab_result",
    "data": {
      "test_name": "HbA1c",
      "value": "7.2",
      "unit": "%",
      "date": "2026-02-09"
    }
  }'
```

---

## 7. Add Single Medication

**Endpoint:**
```
POST /patient/{patient_id}/medication
```

**Description:** إضافة دواء واحد للمريض

### Inputs

| Parameter | Type | Location | Required | Description |
|-----------|------|----------|----------|-------------|
| `patient_id` | string | URL Path | ✅ Yes | معرف المريض |
| `name` | string | Body JSON | ✅ Yes | اسم الدواء |
| `dosage` | string | Body JSON | ❌ No | الجرعة |
| `frequency` | string | Body JSON | ❌ No | عدد المرات |

### Request Body

```json
{
  "name": "Metformin",
  "dosage": "500mg",
  "frequency": "twice daily"
}
```

### Success Response (200 OK)

```json
{
  "status": "success",
  "message": "Medication added successfully",
  "medication": {
    "name": "Metformin",
    "dosage": "500mg",
    "frequency": "twice daily",
    "added_at": "2026-02-09T14:00:00"
  }
}
```

### cURL Example

```bash
curl -X POST "http://localhost:8000/patient/patient_123/medication" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Metformin",
    "dosage": "500mg",
    "frequency": "twice daily"
  }'
```

---

## 8. Add Multiple Medications (Batch)

**Endpoint:**
```
POST /patient/{patient_id}/medications
```

**Description:** إضافة عدة أدوية مرة واحدة

### Inputs

| Parameter | Type | Location | Required | Description |
|-----------|------|----------|----------|-------------|
| `patient_id` | string | URL Path | ✅ Yes | معرف المريض |
| `medications` | array | Body JSON | ✅ Yes | قائمة الأدوية |
| `medications[].name` | string | Body JSON | ✅ Yes | اسم الدواء |
| `medications[].dosage` | string | Body JSON | ❌ No | الجرعة |
| `medications[].frequency` | string | Body JSON | ❌ No | عدد المرات |

### Request Body

```json
{
  "medications": [
    {
      "name": "Metformin",
      "dosage": "1000mg",
      "frequency": "twice daily"
    },
    {
      "name": "Lisinopril",
      "dosage": "10mg",
      "frequency": "once daily"
    },
    {
      "name": "Atorvastatin",
      "dosage": "20mg",
      "frequency": "once daily at bedtime"
    },
    {
      "name": "Aspirin",
      "dosage": "81mg",
      "frequency": "once daily"
    }
  ]
}
```

### Success Response (200 OK)

```json
{
  "status": "success",
  "message": "4 medications added successfully",
  "count": 4
}
```

### cURL Example

```bash
curl -X POST "http://localhost:8000/patient/patient_123/medications" \
  -H "Content-Type: application/json" \
  -d '{
    "medications": [
      {"name": "Metformin", "dosage": "1000mg", "frequency": "twice daily"},
      {"name": "Lisinopril", "dosage": "10mg", "frequency": "once daily"},
      {"name": "Atorvastatin", "dosage": "20mg", "frequency": "once daily"}
    ]
  }'
```

---

## 9. Add Single Condition

**Endpoint:**
```
POST /patient/{patient_id}/condition
```

**Description:** إضافة مرض واحد للمريض

### Inputs

| Parameter | Type | Location | Required | Description |
|-----------|------|----------|----------|-------------|
| `patient_id` | string | URL Path | ✅ Yes | معرف المريض |
| `condition` | string | Body JSON | ✅ Yes | اسم المرض |

### Request Body

```json
{
  "condition": "Diabetes Type 2"
}
```

### Success Response (200 OK)

```json
{
  "status": "success",
  "message": "Condition added successfully",
  "condition": "Diabetes Type 2"
}
```

### cURL Example

```bash
curl -X POST "http://localhost:8000/patient/patient_123/condition" \
  -H "Content-Type: application/json" \
  -d '{"condition": "Diabetes Type 2"}'
```

---

## 10. Add Multiple Conditions (Batch)

**Endpoint:**
```
POST /patient/{patient_id}/conditions
```

**Description:** إضافة عدة أمراض مرة واحدة

### Inputs

| Parameter | Type | Location | Required | Description |
|-----------|------|----------|----------|-------------|
| `patient_id` | string | URL Path | ✅ Yes | معرف المريض |
| `conditions` | array[string] | Body JSON | ✅ Yes | قائمة الأمراض |

### Request Body

```json
{
  "conditions": [
    "Diabetes Type 2",
    "Hypertension",
    "High Cholesterol",
    "Obesity"
  ]
}
```

### Success Response (200 OK)

```json
{
  "status": "success",
  "message": "4 conditions added successfully",
  "count": 4
}
```

### cURL Example

```bash
curl -X POST "http://localhost:8000/patient/patient_123/conditions" \
  -H "Content-Type: application/json" \
  -d '{"conditions": ["Diabetes Type 2", "Hypertension", "High Cholesterol"]}'
```

---

## 11. Add Allergies (Batch)

**Endpoint:**
```
POST /patient/{patient_id}/allergies
```

**Description:** إضافة عدة حساسيات مرة واحدة

### Inputs

| Parameter | Type | Location | Required | Description |
|-----------|------|----------|----------|-------------|
| `patient_id` | string | URL Path | ✅ Yes | معرف المريض |
| `allergies` | array[string] | Body JSON | ✅ Yes | قائمة مسببات الحساسية |

### Request Body

```json
{
  "allergies": [
    "Penicillin",
    "Peanuts",
    "Dust"
  ]
}
```

### Success Response (200 OK)

```json
{
  "status": "success",
  "message": "3 allergies added successfully",
  "count": 3
}
```

### cURL Example

```bash
curl -X POST "http://localhost:8000/patient/patient_123/allergies" \
  -H "Content-Type: application/json" \
  -d '{"allergies": ["Penicillin", "Peanuts", "Dust"]}'
```

---

## 12. Add Family History (Single)

**Endpoint:**
```
POST /patient/{patient_id}/family-history
```

**Description:** إضافة تاريخ عائلي مرضي

### Inputs

| Parameter | Type | Location | Required | Description |
|-----------|------|----------|----------|-------------|
| `patient_id` | string | URL Path | ✅ Yes | معرف المريض |
| `relation` | string | Body JSON | ✅ Yes | صلة القرابة |
| `condition` | string | Body JSON | ✅ Yes | المرض |
| `notes` | string | Body JSON | ❌ No | ملاحظات إضافية |

### Valid Relations

| Value | Description |
|-------|-------------|
| `father` | الأب |
| `mother` | الأم |
| `sibling` | أخ/أخت |
| `grandparent` | جد/جدة |
| `uncle` | عم/خال |
| `aunt` | عمة/خالة |

### Request Body

```json
{
  "relation": "father",
  "condition": "Heart Disease",
  "notes": "توفي في سن 65 بسبب أزمة قلبية"
}
```

### Success Response (200 OK)

```json
{
  "status": "success",
  "message": "Family history added successfully",
  "family_history": {
    "relation": "father",
    "condition": "Heart Disease",
    "notes": "توفي في سن 65 بسبب أزمة قلبية",
    "added_at": "2026-02-09T14:00:00"
  }
}
```

### cURL Example

```bash
curl -X POST "http://localhost:8000/patient/patient_123/family-history" \
  -H "Content-Type: application/json" \
  -d '{
    "relation": "father",
    "condition": "Heart Disease",
    "notes": "توفي في سن 65"
  }'
```

---

## 13. Add Family Histories (Batch)

**Endpoint:**
```
POST /patient/{patient_id}/family-histories
```

**Description:** إضافة تاريخ عائلي مرضي مجمع

### Inputs

| Parameter | Type | Location | Required | Description |
|-----------|------|----------|----------|-------------|
| `patient_id` | string | URL Path | ✅ Yes | معرف المريض |
| `family_histories` | array[string] | Body JSON | ✅ Yes | قائمة الأمراض الوراثية أو العائلية |

### Request Body

```json
{
  "family_histories": [
    "Heart Disease",
    "Diabetes"
  ]
}
```

### Success Response (200 OK)

```json
{
  "status": "success",
  "message": "2 family histories added successfully",
  "count": 2
}
```

### cURL Example

```bash
curl -X POST "http://localhost:8000/patient/patient_123/family-histories" \
  -H "Content-Type: application/json" \
  -d '{"family_histories": ["Heart Disease", "Diabetes"]}'
```

---

## 14. Download Patient History as PDF

**Endpoint:**
```
GET /patient/{patient_id}/history/pdf
```

**Description:** تحميل التاريخ المرضي كملف PDF

### Inputs

| Parameter | Type | Location | Required | Description |
|-----------|------|----------|----------|-------------|
| `patient_id` | string | URL Path | ✅ Yes | معرف المريض |

### Success Response (200 OK)

**Content-Type:** `application/pdf`

**Response:** Binary PDF file download

### cURL Example

```bash
curl -X GET "http://localhost:8000/patient/patient_123/history/pdf" \
  -o patient_history.pdf
```

---

# 📋 Doctor Reports

## 1. Generate AI Doctor Report

**Endpoint:**
```
GET /report/{patient_id}/doctor-report
```

**Description:** إنشاء تقرير طبي شامل بالذكاء الاصطناعي مع الأخذ في الاعتبار فصيلة الدم، الحساسيات، التاريخ العائلي والأمراض المزمنة الخاصة بالمريض.

### Inputs

| Parameter | Type | Location | Required | Description |
|-----------|------|----------|----------|-------------|
| `patient_id` | string | URL Path | ✅ Yes | معرف المريض |
| `user_role` | string | Query Param | ❌ No | نوع المستخدم (patient/doctor) |

### User Role Options

| Value | Language | Style | Use Case |
|-------|----------|-------|----------|
| `patient` | عامية مصرية 🇪🇬 | بسيط وواضح | للمريض |
| `doctor` | English 🇬🇧 | Clinical terminology | للطبيب |

### Request Examples

```
GET /report/patient_123/doctor-report?user_role=patient
GET /report/patient_123/doctor-report?user_role=doctor
```

### Success Response - Patient Role (Arabic)

```json
{
  "status": "success",
  "patient_id": "patient_123",
  "report": "## ملخص حالتك الصحية\n\nأهلاً بيك يا فندم! إنت عندك سكر من النوع التاني وضغط عالي...\n\n### الأدوية بتاعتك\n- **ميتفورمين**: دا بيساعد ينظم السكر...\n\n### الأكل الممنوع\n- السكريات والحلويات\n- المشروبات الغازية...",
  "generated_at": "2026-02-09T14:00:00",
  "profile_based": true
}
```

### Success Response - Doctor Role (English)

```json
{
  "status": "success",
  "patient_id": "patient_123",
  "report": "## Clinical Summary\n\n45-year-old male with Type 2 Diabetes Mellitus and Essential Hypertension...\n\n### Current Medications\n- Metformin 1000mg BID\n- Lisinopril 10mg QD...\n\n### Recommendations\n1. Continue current medication regimen...",
  "generated_at": "2026-02-09T14:00:00",
  "profile_based": true
}
```

### cURL Examples

```bash
# Patient Report (Arabic)
curl -X GET "http://localhost:8000/report/patient_123/doctor-report?user_role=patient"

# Doctor Report (English)
curl -X GET "http://localhost:8000/report/patient_123/doctor-report?user_role=doctor"
```

---

## 2. Download AI Report as PDF

**Endpoint:**
```
GET /report/{patient_id}/doctor-report/pdf
```

**Description:** إنشاء وتحميل التقرير الطبي بصيغة PDF. يدعم هذا الرابط تمرير `user_role` لتغيير لغة التقرير تماماً كما في نقطة النهاية الخاصة بـ JSON، حيث يتم دمج جميع بيانات المريض (الأمراض، الأدوية، التاريخ العائلي، وفصيلة الدم) بشكل احترافي داخل الـ PDF.

### Inputs

| Parameter | Type | Location | Required | Description |
|-----------|------|----------|----------|-------------|
| `patient_id` | string | URL Path | ✅ Yes | معرف المريض |
| `user_role` | string | Query Param | ❌ No | نوع المستخدم (patient/doctor) |

### Request Examples

```
GET /report/patient_123/doctor-report/pdf?user_role=patient
GET /report/patient_123/doctor-report/pdf?user_role=doctor
```

### Success Response (200 OK)

**Content-Type:** `application/pdf`

**Response:** Binary PDF file download

### cURL Examples

```bash
# Patient PDF (Arabic)
curl -X GET "http://localhost:8000/report/patient_123/doctor-report/pdf?user_role=patient" \
  -o patient_report_ar.pdf

# Doctor PDF (English)
curl -X GET "http://localhost:8000/report/patient_123/doctor-report/pdf?user_role=doctor" \
  -o doctor_report_en.pdf
```

---

## 3. Quick Patient Summary

**Endpoint:**
```
GET /report/{patient_id}/quick-summary
```

**Description:** ملخص سريع بدون استخدام AI (أسرع)

### Inputs

| Parameter | Type | Location | Required | Description |
|-----------|------|----------|----------|-------------|
| `patient_id` | string | URL Path | ✅ Yes | معرف المريض |

### Success Response (200 OK)

```json
{
  "status": "success",
  "patient_id": "patient_123",
  "summary": {
    "profile": {
      "name": "أحمد محمد",
      "age": "45",
      "gender": "male"
    },
    "conditions": ["Diabetes Type 2", "Hypertension"],
    "medications_count": 4,
    "allergies": ["Penicillin"],
    "has_family_history": true
  }
}
```

### cURL Example

```bash
curl -X GET "http://localhost:8000/report/patient_123/quick-summary"
```

---

# 🖼️ Image Analysis

## 1. Analyze Medical Image

**Endpoint:**
```
POST /image/analyze
```

**Description:** تحليل صورة طبية (تحليل معملي، أشعة، جلدية)

### Inputs

| Parameter | Type | Location | Required | Description |
|-----------|------|----------|----------|-------------|
| `file` | File | Form Data | ✅ Yes | ملف الصورة |
| `image_type` | string | Form Data | ❌ No | نوع الصورة |
| `symptoms` | string | Form Data | ❌ No | الأعراض |
| `user_role` | string | Form Data | ✅ Yes | نوع المستخدم |

### Valid Image Types

| Value | Description |
|-------|-------------|
| `blood_test` | تحليل دم |
| `xray` | أشعة سينية |
| `ct_scan` | أشعة مقطعية |
| `mri` | رنين مغناطيسي |
| `skin` | صورة جلدية |
| `ultrasound` | موجات صوتية |
| `ecg` | رسم قلب |

### Form Data Example

```
file: [image.jpg]
image_type: blood_test
symptoms: fatigue, increased thirst
user_role: patient
```

### Success Response - Patient (Arabic)

```json
{
  "status": "success",
  "analysis": "✅ **تم التحليل بنجاح!**\n\n📊 **النتايج:**\n\nأهلاً بيك يا فندم! خليني أشرحلك نتيجة التحليل:\n\n- **السكر الصايم**: 180 - دا أعلى من الطبيعي يا فندم\n- **الهيموجلوبين**: طبيعي\n\n⚠️ لازم تروح للدكتور علشان...",
  "image_path": "/data/uploaded_images/api_upload_20260209.jpg",
  "timestamp": "2026-02-09T14:00:00",
  "cached": false
}
```

### Success Response - Doctor (English)

```json
{
  "status": "success",
  "analysis": "✅ **Analysis Complete**\n\n📊 **Clinical Findings:**\n\n### Extracted Values:\n- **Fasting Glucose**: 180 mg/dL (⚠️ Elevated)\n- **HbA1c**: 7.2% (⚠️ Above target)\n- **Hemoglobin**: 14.2 g/dL (Normal)\n\n### Recommendations:\n1. Review current diabetes management...",
  "image_path": "/data/uploaded_images/api_upload_20260209.jpg",
  "timestamp": "2026-02-09T14:00:00",
  "cached": false
}
```

### cURL Example

```bash
curl -X POST "http://localhost:8000/image/analyze" \
  -F "file=@blood_test.jpg" \
  -F "image_type=blood_test" \
  -F "symptoms=fatigue, thirst" \
  -F "user_role=patient"
```

---

## 2. Analyze & Save to Patient History

**Endpoint:**
```
POST /image/analyze-with-history
```

**Description:** تحليل الصورة وحفظ النتيجة في سجل المريض

### Inputs

| Parameter | Type | Location | Required | Description |
|-----------|------|----------|----------|-------------|
| `file` | File | Form Data | ✅ Yes | ملف الصورة |
| `patient_id` | string | Form Data | ✅ Yes | معرف المريض |
| `image_type` | string | Form Data | ❌ No | نوع الصورة |
| `user_role` | string | Form Data | ✅ Yes | نوع المستخدم |

### Form Data Example

```
file: [xray.jpg]
patient_id: patient_123
image_type: xray
user_role: doctor
```

### Success Response (200 OK)

```json
{
  "status": "success",
  "analysis": "...",
  "patient_id": "patient_123",
  "saved_to_history": true,
  "record_id": "rec_xyz789",
  "timestamp": "2026-02-09T14:00:00"
}
```

### cURL Example

```bash
curl -X POST "http://localhost:8000/image/analyze-with-history" \
  -F "file=@chest_xray.jpg" \
  -F "patient_id=patient_123" \
  -F "image_type=xray" \
  -F "user_role=doctor"
```

---

# 💬 Chat

## 1. Send Chat Message

**Endpoint:**
```
POST /chat/
```

**Description:** إرسال سؤال طبي والحصول على رد من الذكاء الاصطناعي

### Inputs

| Parameter | Type | Location | Required | Description |
|-----------|------|----------|----------|-------------|
| `message` | string | Body JSON | ✅ Yes | الرسالة/السؤال |
| `patient_id` | string | Body JSON | ❌ No | معرف المريض (للسياق) |
| `user_role` | string | Body JSON | ❌ No | نوع المستخدم |
| `session_id` | string | Body JSON | ❌ No | معرف الجلسة |

### Request Body

```json
{
  "message": "ما هي أعراض السكري؟",
  "patient_id": "patient_123",
  "user_role": "patient",
  "session_id": "session_abc123"
}
```

### Success Response - Patient (Arabic)

```json
{
  "status": "success",
  "response": "أهلاً بيك! 😊\n\nأعراض السكر بتكون زي:\n\n1. **العطش الشديد** - بتحس إنك عايز تشرب كتير\n2. **التبول المتكرر** - خصوصاً بالليل\n3. **التعب والإرهاق** - من غير سبب واضح\n4. **فقدان الوزن** - من غير رجيم\n\nلو عندك الأعراض دي، لازم تروح للدكتور تعمل تحليل سكر 🩺",
  "session_id": "session_abc123",
  "timestamp": "2026-02-09T14:00:00"
}
```

### Success Response - Doctor (English)

```json
{
  "status": "success",
  "response": "## Diabetes Mellitus - Clinical Presentation\n\n### Cardinal Symptoms:\n1. **Polyuria** - Increased urinary frequency\n2. **Polydipsia** - Excessive thirst\n3. **Polyphagia** - Increased hunger\n4. **Unexplained weight loss**\n\n### Additional Signs:\n- Fatigue and weakness\n- Blurred vision\n- Slow wound healing\n- Recurrent infections\n\n### Recommendation:\nOrder FPG, HbA1c, or OGTT for confirmation.",
  "session_id": "session_abc123",
  "timestamp": "2026-02-09T14:00:00"
}
```

### cURL Example

```bash
curl -X POST "http://localhost:8000/chat/" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "ما هي أعراض السكري؟",
    "patient_id": "patient_123",
    "user_role": "patient"
  }'
```

---

## 2. Clear Chat Session

**Endpoint:**
```
POST /chat/clear-session
```

**Description:** مسح محادثة سابقة

### Inputs

| Parameter | Type | Location | Required | Description |
|-----------|------|----------|----------|-------------|
| `session_id` | string | Body JSON | ✅ Yes | معرف الجلسة |

### Request Body

```json
{
  "session_id": "session_abc123"
}
```

### Success Response (200 OK)

```json
{
  "status": "success",
  "message": "Session cleared successfully"
}
```

### cURL Example

```bash
curl -X POST "http://localhost:8000/chat/clear-session" \
  -H "Content-Type: application/json" \
  -d '{"session_id": "session_abc123"}'
```

---

# 🔧 System Endpoints

## 1. Health Check

**Endpoint:**
```
GET /health
```

**Description:** التحقق من حالة الخادم

### Success Response (200 OK)

```json
{
  "status": "healthy",
  "timestamp": "2026-02-09T14:00:00",
  "version": "2.0.0"
}
```

### cURL Example

```bash
curl -X GET "http://localhost:8000/health"
```

---

## 2. Cache Statistics

**Endpoint:**
```
GET /cache/stats
```

**Description:** إحصائيات الـ Cache

### Success Response (200 OK)

```json
{
  "status": "success",
  "stats": {
    "total_entries": 150,
    "hit_rate": "85%",
    "memory_usage": "45MB"
  }
}
```

---

## 3. Clear Cache

**Endpoint:**
```
DELETE /cache/clear
```

**Description:** مسح الـ Cache

### Success Response (200 OK)

```json
{
  "status": "success",
  "message": "Cache cleared successfully"
}
```

---

## 4. Security Status

**Endpoint:**
```
GET /security/status
```

**Description:** حالة الأمان والـ Rate Limiting

### Success Response (200 OK)

```json
{
  "status": "success",
  "security": {
    "rate_limit_remaining": 95,
    "rate_limit_reset": "2026-02-09T15:00:00"
  }
}
```

---

# 🧪 Complete Test Flow

```bash
# 1. Check server health
curl http://localhost:8000/health

# 2. Create patient profile
curl -X POST "http://localhost:8000/patient/test_patient/profile" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "age": "35", "gender": "male", "phone": "01000000000"}'

# 3. Add conditions
curl -X POST "http://localhost:8000/patient/test_patient/conditions" \
  -H "Content-Type: application/json" \
  -d '{"conditions": ["Diabetes Type 2", "Hypertension"]}'

# 4. Add medications
curl -X POST "http://localhost:8000/patient/test_patient/medications" \
  -H "Content-Type: application/json" \
  -d '{"medications": [{"name": "Metformin", "dosage": "1000mg"}, {"name": "Lisinopril", "dosage": "10mg"}]}'

# 5. Add family history
curl -X POST "http://localhost:8000/patient/test_patient/family-history" \
  -H "Content-Type: application/json" \
  -d '{"relation": "father", "condition": "Heart Disease"}'

# 6. Get patient data
curl http://localhost:8000/patient/test_patient/history

# 7. Generate AI report (Arabic)
curl "http://localhost:8000/report/test_patient/doctor-report?user_role=patient"

# 8. Download PDF report
curl "http://localhost:8000/report/test_patient/doctor-report/pdf?user_role=patient" -o report.pdf

# 9. Chat with context
curl -X POST "http://localhost:8000/chat/" \
  -H "Content-Type: application/json" \
  -d '{"message": "ايه الأكل الممنوع عليا؟", "patient_id": "test_patient", "user_role": "patient"}'

# 10. Cleanup (optional)
curl -X DELETE "http://localhost:8000/patient/test_patient/history"
```

---

## 📚 Interactive Documentation

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
