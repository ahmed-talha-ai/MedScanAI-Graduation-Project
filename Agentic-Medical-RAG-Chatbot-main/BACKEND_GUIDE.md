# 🔧 Backend Developer Quick Start Guide

> **للـ Backend Developer اللي هيربط الـ API مع الـ Frontend**

---

## ⚡ Quick Start (5 دقايق)

### 1️⃣ تشغيل السيرفر

```bash
# 1. ادخل مجلد المشروع
cd "d:\University\Graduation Project\Final Folder\Agentic-Medical-RAG-Chatbot-main"

# 2. فعّل الـ Virtual Environment
mediscan\Scripts\activate

# 3. شغّل السيرفر
python -m uvicorn api.main:app --reload --port 8000
```

### 2️⃣ تأكد إنه شغال

```bash
curl http://localhost:8000/health
```

**لازم يرد:**
```json
{"status": "ok", "message": "🏥 MediScan API is running", "timestamp": "..."}
```

### 3️⃣ افتح الـ Docs

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## 🔗 API Endpoints Summary

| Endpoint | Method | وظيفة |
|----------|--------|------|
| `/health` | GET | Health check |
| `/chat/` | POST | إرسال رسالة للـ Chatbot |
| `/images/analyze` | POST | تحليل صورة طبية |
| `/patient/{id}` | GET | جلب بيانات مريض |
| `/patient/{id}/profile` | POST | تحديث بيانات مريض |
| `/report/{id}/doctor-report` | GET | تقرير AI |
| `/report/{id}/doctor-report/pdf` | GET | تحميل PDF |

---

## 💬 Chat Endpoint (الأهم)

### Request

```http
POST /chat/
Content-Type: application/json

{
  "message": "ما هي أعراض السكري؟",
  "patient_id": "123",
  "user_role": "patient"
}
```

### Parameters

| Parameter | Type | Required | Values |
|-----------|------|----------|--------|
| `message` | string | ✅ | السؤال أو الرسالة |
| `patient_id` | string | ❌ | معرف المريض (لو موجود) |
| `user_role` | string | ✅ | `"patient"` or `"doctor"` |

### Response

```json
{
  "status": "success",
  "response": "أعراض السكري الشائعة تشمل...",
  "patient_id": "123",
  "timestamp": "2026-02-05T23:00:00"
}
```

### JavaScript Example

```javascript
async function chat(message, patientId, userRole) {
  const response = await fetch('http://localhost:8000/chat/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      patient_id: patientId,
      user_role: userRole  // 'patient' = Arabic, 'doctor' = English
    })
  });
  return await response.json();
}

// Example
const result = await chat('ايه اعراض الضغط العالي؟', 'user123', 'patient');
console.log(result.response);
```

---

## 🖼️ Image Analysis Endpoint

### Request (FormData)

```http
POST /images/analyze
Content-Type: multipart/form-data

file: [image file]
image_type: "blood_test"
user_role: "patient"
symptoms: "تعب وإرهاق"
```

### Parameters

| Parameter | Type | Required | Values |
|-----------|------|----------|--------|
| `file` | File | ✅ | صورة (jpg, png) |
| `image_type` | string | ❌ | `blood_test`, `xray`, `skin`, `auto` |
| `user_role` | string | ✅ | `"patient"` or `"doctor"` |
| `symptoms` | string | ❌ | أعراض إضافية |

### JavaScript Example

```javascript
async function analyzeImage(file, userRole) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('user_role', userRole);
  
  const response = await fetch('http://localhost:8000/images/analyze', {
    method: 'POST',
    body: formData
  });
  return await response.json();
}

// With file input
const fileInput = document.getElementById('imageInput');
const result = await analyzeImage(fileInput.files[0], 'patient');
```

---

## 👤 Patient Management

### Get Patient

```javascript
async function getPatient(patientId) {
  const response = await fetch(`http://localhost:8000/patient/${patientId}`);
  if (!response.ok) {
    if (response.status === 404) return null; // New patient
    throw new Error('Failed to get patient');
  }
  return await response.json();
}
```

### Create/Update Profile

```javascript
async function updateProfile(patientId, profile) {
  const response = await fetch(`http://localhost:8000/patient/${patientId}/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile)
  });
  return await response.json();
}

// Example
await updateProfile('user123', {
  name: 'Ahmed Mohamed',
  age: '35',
  gender: 'male',
  phone: '01012345678'
});
```

### Add Conditions

```javascript
await fetch(`http://localhost:8000/patient/${patientId}/conditions`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    conditions: ['Diabetes Type 2', 'Hypertension']
  })
});
```

### Add Medications

```javascript
await fetch(`http://localhost:8000/patient/${patientId}/medications`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    medications: [
      { name: 'Metformin', dosage: '1000mg', frequency: 'twice daily' },
      { name: 'Lisinopril', dosage: '10mg', frequency: 'once daily' }
    ]
  })
});
```

---

## 📄 Reports & PDF

### Get AI Report (JSON)

```javascript
async function getReport(patientId, userRole) {
  const response = await fetch(
    `http://localhost:8000/report/${patientId}/doctor-report?user_role=${userRole}`
  );
  return await response.json();
}
```

### Download PDF

```javascript
async function downloadPDF(patientId, userRole) {
  const response = await fetch(
    `http://localhost:8000/report/${patientId}/doctor-report/pdf?user_role=${userRole}`
  );
  const blob = await response.blob();
  
  // Create download link
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `report_${patientId}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
```

---

## 🔄 User Roles System

| Role | Language | Use Case |
|------|----------|----------|
| `patient` | Egyptian Arabic (العامية) | واجهة المريض - ردود بسيطة ومفهومة |
| `doctor` | English | واجهة الدكتور - مصطلحات طبية متخصصة |

**مهم:** الـ `user_role` بيأثر على:
1. لغة الرد (عربي/إنجليزي)
2. مستوى التفاصيل
3. المصطلحات المستخدمة

---

## ⚠️ Error Handling

### Error Response Format

```json
{
  "status": "error",
  "detail": "رسالة الخطأ",
  "timestamp": "2026-02-05T23:00:00"
}
```

### Common HTTP Status Codes

| Code | Meaning | Solution |
|------|---------|----------|
| `200` | Success | ✅ كل حاجة تمام |
| `400` | Bad Request | تأكد من البيانات المرسلة |
| `404` | Not Found | المريض أو الملف مش موجود |
| `422` | Validation Error | البيانات مش صحيحة |
| `500` | Server Error | مشكلة في السيرفر |
| `503` | Service Unavailable | الـ LLM مش متاح |

### JavaScript Error Handling

```javascript
async function safeAPICall(url, options) {
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.detail || 'Unknown error');
    }
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

---

## 🌐 CORS Configuration

السيرفر مفتوح لكل الـ origins في الـ development:

```python
# api/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change in production!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**للـ Production:** غيّر `allow_origins` لـ domain الـ Frontend بس.

---

## 📁 Data Storage

### Patient Data Location

```
data/patient_history/
├── patient_123.json
├── patient_456.json
└── ...
```

### Patient JSON Structure

```json
{
  "patient_id": "123",
  "profile": {
    "name": "Ahmed Mohamed",
    "age": "35",
    "gender": "male",
    "phone": "01012345678"
  },
  "conditions": ["Diabetes Type 2", "Hypertension"],
  "medications": [
    {"name": "Metformin", "dosage": "1000mg", "frequency": "twice daily"}
  ],
  "allergies": ["Penicillin"],
  "family_history": [
    {"relation": "father", "condition": "Heart Disease"}
  ],
  "medical_records": [],
  "created_at": "2026-02-05T23:00:00",
  "updated_at": "2026-02-05T23:00:00"
}
```

---

## 🧪 Testing Checklist

قبل ما تربط الـ Frontend، اختبر الـ endpoints دي:

```bash
# 1. Health Check
curl http://localhost:8000/health

# 2. Chat (Arabic)
curl -X POST "http://localhost:8000/chat/" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"ايه اعراض السكر؟\", \"user_role\": \"patient\"}"

# 3. Chat (English)
curl -X POST "http://localhost:8000/chat/" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"What are diabetes symptoms?\", \"user_role\": \"doctor\"}"

# 4. Create Patient
curl -X POST "http://localhost:8000/patient/test123/profile" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Test User\", \"age\": \"30\", \"gender\": \"male\"}"

# 5. Get Patient
curl "http://localhost:8000/patient/test123"

# 6. Image Analysis (with test image)
curl -X POST "http://localhost:8000/images/analyze" \
  -F "file=@test_image.jpg" \
  -F "user_role=patient"
```

---

## 🔥 Common Issues & Solutions

| المشكلة | الحل |
|---------|------|
| السيرفر مش بيشتغل | تأكد الـ `.env` فيه API keys صحيحة |
| الرد بطيء | طبيعي أول مرة (loading models) |
| خطأ في الـ Arabic | تأكد الـ `user_role` = `"patient"` |
| Image analysis fails | تأكد الصورة < 10MB و format صحيح |
| CORS errors | تأكد السيرفر شغال على port 8000 |

---

## 📚 Full Documentation

للتفاصيل الكاملة، راجع:
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - توثيق شامل لكل الـ endpoints
- **[README.md](./README.md)** - تعليمات التثبيت

---

## 📞 Support

لو حصلت مشكلة:
1. تأكد الـ `.env` file موجود وفيه API keys
2. تأكد الـ virtual environment مفعّل
3. شغّل `pip install -r requirements.txt` تاني
4. راجع الـ logs في الـ terminal

---

**Happy Coding! 🚀**
