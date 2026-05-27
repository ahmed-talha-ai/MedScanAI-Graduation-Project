# MediScan AI - Complete Project Documentation

> **For Backend & Frontend Developers** | Version 2.0.0 | February 2026

---

# TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [Installation & Setup](#2-installation--setup)
3. [Environment Variables](#3-environment-variables)
4. [Running the Server](#4-running-the-server)
5. [Project Structure](#5-project-structure)
6. [API Endpoints](#6-api-endpoints)
7. [Database Integration](#7-database-integration)
8. [Frontend Integration](#8-frontend-integration)
9. [Complete Testing Guide](#9-complete-testing-guide)

---

# 1. PROJECT OVERVIEW

## What is MediScan?

MediScan is an **AI-powered medical assistant** that provides:
- 💬 **Chat**: Answer medical questions using RAG (Retrieval-Augmented Generation)
- 🖼️ **Image Analysis**: Analyze lab results, X-rays, skin conditions
- 📋 **Patient Management**: Store patient profiles, conditions, medications
- 📄 **AI Reports**: Generate medical reports as PDF

## Two User Roles

| Role | Language | Response Style |
|------|----------|----------------|
| `patient` | Egyptian Arabic (العامية) | Simple, friendly, easy to understand |
| `doctor` | English | Clinical terminology, detailed analysis |

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | FastAPI (Python) |
| AI/LLM | LangChain + Groq/Gemini/OpenAI |
| Vector DB | FAISS |
| Embeddings | HuggingFace |
| OCR | EasyOCR + Tesseract |
| PDF | ReportLab |

---

# 2. INSTALLATION & SETUP

## Step 1: Clone/Download Project

```bash
cd "d:\University\Graduation Project\Final Folder\Agentic-Medical-RAG-Chatbot-main"
```

## Step 2: Create Virtual Environment

```bash
python -m venv venv
venv\Scripts\activate
```

## Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

## Step 4: Install PyTorch (GPU Support - Optional)

```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu129
```

---

# 3. ENVIRONMENT VARIABLES

Create a `.env` file in the project root:

```env
# LLM API Keys (at least one required)
GROQ_API_KEY=gsk_xxxxxxxxxxxx
GEMINI_API_KEY=xxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxx
OPENROUTER_API_KEY=sk-or-xxxxxxxxxxxx

# HuggingFace (for embeddings)
HUGGINGFACE_API_TOKEN=hf_xxxxxxxxxxxx

# Web Search (optional)
TAVILY_API_KEY=tvly-xxxxxxxxxxxx
```

### How to Get API Keys:

| Provider | URL |
|----------|-----|
| Groq | https://console.groq.com/keys |
| Gemini | https://makersuite.google.com/app/apikey |
| OpenAI | https://platform.openai.com/api-keys |
| HuggingFace | https://huggingface.co/settings/tokens |

---

# 4. RUNNING THE SERVER

## Development Mode (Auto-reload)

```bash
cd "d:\University\Graduation Project\Final Folder\Agentic-Medical-RAG-Chatbot-main"
python -m uvicorn api.main:app --reload --port 8000
```

## Production Mode

```bash
uvicorn api.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## Verify Server Running

```bash
curl http://localhost:8000/health
```

**Expected Response:**
```json
{"status": "healthy", "timestamp": "2026-02-05T21:00:00"}
```

---

# 5. PROJECT STRUCTURE

```
Agentic-Medical-RAG-Chatbot-main/
│
├── api/                          # FastAPI Routers
│   ├── main.py                   # Entry point, mounts all routers
│   ├── chat.py                   # POST /chat/ - Chatbot
│   ├── image_analysis.py         # POST /image/analyze - Image analysis
│   ├── patient.py                # Patient CRUD endpoints
│   ├── medical_report.py         # AI report generation
│   └── models.py                 # Pydantic models
│
├── src/                          # Core Logic
│   ├── agent.py                  # LangGraph agent with tools
│   ├── tools.py                  # Agent tools (search, analyze)
│   ├── retriever.py              # RAG retrieval + reranking
│   ├── semantic_cache.py         # Query caching
│   ├── medical_history.py        # Patient data storage (JSON)
│   ├── pdf_generator.py          # PDF report generation
│   ├── config.py                 # LLM + embeddings config
│   └── image_processing.py       # Image compression
│
├── data/                         # Data Files
│   ├── patient_history/          # Patient JSON files
│   └── *.txt                     # Medical reference documents
│
├── .env                          # Environment variables
├── requirements.txt              # Python dependencies
└── API_DOCUMENTATION.md          # This file
```

---

# 6. API ENDPOINTS

## Base URL
```
http://localhost:8000
```

---

## 6.1 Health Check

```
GET /health
```

**cURL:**
```bash
curl http://localhost:8000/health
```

---

## 6.2 Chat

```
POST /chat/
```

**Request:**
```json
{
  "message": "ما هي أعراض السكري؟",
  "patient_id": "123",
  "user_role": "patient"
}
```

**cURL (Patient - Arabic):**
```bash
curl -X POST "http://localhost:8000/chat/" -H "Content-Type: application/json" -d "{\"message\": \"ما هي أعراض السكري؟\", \"patient_id\": \"123\", \"user_role\": \"patient\"}"
```

**cURL (Doctor - English):**
```bash
curl -X POST "http://localhost:8000/chat/" -H "Content-Type: application/json" -d "{\"message\": \"What are diabetes symptoms?\", \"patient_id\": \"123\", \"user_role\": \"doctor\"}"
```

---

## 6.3 Image Analysis

### Analyze Single Image

```
POST /image/analyze
```

**Form Fields:**
| Field | Type | Required |
|-------|------|----------|
| file | File | Yes |
| image_type | string | No (blood_test, xray, skin) |
| symptoms | string | No |
| user_role | string | Yes (patient/doctor) |

**cURL:**
```bash
curl -X POST "http://localhost:8000/image/analyze" -F "file=@lab_result.jpg" -F "image_type=blood_test" -F "user_role=patient"
```

### Analyze & Save to History

```
POST /image/analyze-with-history
```

**cURL:**
```bash
curl -X POST "http://localhost:8000/image/analyze-with-history" -F "file=@lab_result.jpg" -F "patient_id=123" -F "user_role=doctor"
```

---

## 6.4 Patient Management

### Get Patient Data

```
GET /patient/{patient_id}
```

**cURL:**
```bash
curl "http://localhost:8000/patient/123"
```

**Response:**
```json
{
  "patient_id": "123",
  "profile": {
    "name": "Ahmed Mohamed",
    "age": "45",
    "gender": "male",
    "phone": "01012345678",
    "blood_type": "O+"
  },
  "conditions": ["Diabetes Type 2", "Hypertension"],
  "medications": [{"name": "Metformin", "dosage": "1000mg"}],
  "allergies": ["Penicillin"],
  "family_history": [{"relation": "father", "condition": "Heart Disease"}]
}
```

---

### Update Profile

```
POST /patient/{patient_id}/profile
```

**Request:**
```json
{
  "name": "Ahmed Mohamed",
  "age": "45",
  "gender": "male",
  "phone": "01012345678",
  "blood_type": "O+"
}
```

**cURL:**
```bash
curl -X POST "http://localhost:8000/patient/123/profile" -H "Content-Type: application/json" -d "{\"name\": \"Ahmed Mohamed\", \"age\": \"45\", \"gender\": \"male\", \"phone\": \"01012345678\", \"blood_type\": \"O+\"}"
```

---

### Add Conditions (Batch)

```
POST /patient/{patient_id}/conditions
```

**Request:**
```json
{
  "conditions": ["Diabetes Type 2", "Hypertension", "High Cholesterol"]
}
```

**cURL:**
```bash
curl -X POST "http://localhost:8000/patient/123/conditions" -H "Content-Type: application/json" -d "{\"conditions\": [\"Diabetes Type 2\", \"Hypertension\"]}"
```

---

### Add Medications (Batch)

```
POST /patient/{patient_id}/medications
```

**Request:**
```json
{
  "medications": [
    {"name": "Metformin", "dosage": "1000mg", "frequency": "twice daily"},
    {"name": "Lisinopril", "dosage": "10mg", "frequency": "once daily"}
  ]
}
```

**cURL:**
```bash
curl -X POST "http://localhost:8000/patient/123/medications" -H "Content-Type: application/json" -d "{\"medications\": [{\"name\": \"Metformin\", \"dosage\": \"1000mg\"}]}"
```

---

### Add Allergies (Batch)

```
POST /patient/{patient_id}/allergies
```

**Request:**
```json
{
  "allergies": ["Penicillin", "Peanuts"]
}
```

**cURL:**
```bash
curl -X POST "http://localhost:8000/patient/123/allergies" -H "Content-Type: application/json" -d "{\"allergies\": [\"Penicillin\", \"Peanuts\"]}"
```

---

### Add Family Histories (Batch)

```
POST /patient/{patient_id}/family-histories
```

**Request:**
```json
{
  "family_histories": ["Heart Disease", "Diabetes"]
}
```

**cURL:**
```bash
curl -X POST "http://localhost:8000/patient/123/family-histories" -H "Content-Type: application/json" -d "{\"family_histories\": [\"Heart Disease\", \"Diabetes\"]}"
```

---

### Add Family History (Single)

```
POST /patient/{patient_id}/family-history
```

**Request:**
```json
{
  "relation": "father",
  "condition": "Heart Disease",
  "notes": "Died at age 65"
}
```

**cURL:**
```bash
curl -X POST "http://localhost:8000/patient/123/family-history" -H "Content-Type: application/json" -d "{\"relation\": \"father\", \"condition\": \"Heart Disease\"}"
```

---

### Get Summary

```
GET /patient/{patient_id}/summary
```

**cURL:**
```bash
curl "http://localhost:8000/patient/123/summary"
```

---

### Get Warnings

```
GET /patient/{patient_id}/warnings
```

**cURL:**
```bash
curl "http://localhost:8000/patient/123/warnings"
```

---

### Download Patient PDF

```
GET /patient/{patient_id}/pdf
```

**cURL:**
```bash
curl "http://localhost:8000/patient/123/pdf" --output patient.pdf
```

---

### Delete Patient

```
DELETE /patient/{patient_id}
```

**cURL:**
```bash
curl -X DELETE "http://localhost:8000/patient/123"
```

---

## 6.5 AI Reports

### Get Report (JSON)

```
GET /report/{patient_id}/doctor-report?user_role={role}
```

**Description:** Generates an AI-driven, highly professional medical report based on the patient's conditions, medications, allergies, family history, and blood type. 

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `patient_id` | string | ✅ Yes | The patient's ID |
| `user_role` | string | ❌ No (Default: `doctor`) | Switches the language and style of the report. Supports `patient` (Egyptian Arabic, simplified) and `doctor` (English, clinical). |

**cURL (Patient - Arabic):**
```bash
curl "http://localhost:8000/report/123/doctor-report?user_role=patient"
```

**cURL (Doctor - English):**
```bash
curl "http://localhost:8000/report/123/doctor-report?user_role=doctor"
```

**Response:**
```json
{
  "status": "success",
  "patient_id": "123",
  "report": "## ملخص حالتك الصحية\n...",
  "generated_at": "2026-02-05T21:00:00"
}
```

---

### Download Report PDF

```
GET /report/{patient_id}/doctor-report/pdf?user_role={role}
```

**Description:** Generates a professional, printable PDF document containing the AI-generated report and all patient information. The language and style depend on the `user_role` parameter.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `patient_id` | string | ✅ Yes | The patient's ID |
| `user_role` | string | ❌ No (Default: `doctor`) | Switches the language of the PDF. Supports `patient` (Egyptian Arabic) and `doctor` (English). |

**cURL (Patient - Arabic PDF):**
```bash
curl "http://localhost:8000/report/123/doctor-report/pdf?user_role=patient" --output report_ar.pdf
```

**cURL (Doctor - English PDF):**
```bash
curl "http://localhost:8000/report/123/doctor-report/pdf?user_role=doctor" --output report_en.pdf
```

---

### Quick Summary (No AI)

```
GET /report/{patient_id}/quick-summary
```

**cURL:**
```bash
curl "http://localhost:8000/report/123/quick-summary"
```

---

## 6.6 Cache & Security

### Cache Stats

```bash
curl "http://localhost:8000/cache/stats"
```

### Clear Cache

```bash
curl -X DELETE "http://localhost:8000/cache/clear"
```

### Security Status

```bash
curl "http://localhost:8000/security/status"
```

---

# 7. DATABASE INTEGRATION

## Current Storage

Currently, patient data is stored in JSON files in `data/patient_history/`.

## SQL Schemas for Database Migration

### Patients Table
```sql
CREATE TABLE patients (
    patient_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100),
    age VARCHAR(10),
    gender VARCHAR(10),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Conditions Table
```sql
CREATE TABLE patient_conditions (
    id SERIAL PRIMARY KEY,
    patient_id VARCHAR(50) REFERENCES patients(patient_id) ON DELETE CASCADE,
    condition VARCHAR(100) NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Medications Table
```sql
CREATE TABLE patient_medications (
    id SERIAL PRIMARY KEY,
    patient_id VARCHAR(50) REFERENCES patients(patient_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    dosage VARCHAR(50),
    frequency VARCHAR(50),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Allergies Table
```sql
CREATE TABLE patient_allergies (
    id SERIAL PRIMARY KEY,
    patient_id VARCHAR(50) REFERENCES patients(patient_id) ON DELETE CASCADE,
    allergy VARCHAR(100) NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Family History Table
```sql
CREATE TABLE patient_family_history (
    id SERIAL PRIMARY KEY,
    patient_id VARCHAR(50) REFERENCES patients(patient_id) ON DELETE CASCADE,
    relation VARCHAR(50) NOT NULL,
    condition VARCHAR(100) NOT NULL,
    notes TEXT,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Medical Records Table
```sql
CREATE TABLE medical_records (
    id SERIAL PRIMARY KEY,
    patient_id VARCHAR(50) REFERENCES patients(patient_id) ON DELETE CASCADE,
    record_type VARCHAR(50),
    data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

# 8. FRONTEND INTEGRATION

## JavaScript/TypeScript Examples

### Chat
```javascript
async function sendMessage(message, patientId, userRole) {
  const response = await fetch('http://localhost:8000/chat/', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      message: message,
      patient_id: patientId,
      user_role: userRole
    })
  });
  return await response.json();
}

// Usage
const result = await sendMessage('ما هي أعراض السكري؟', '123', 'patient');
console.log(result.response);
```

### Get Patient
```javascript
async function getPatient(patientId) {
  const response = await fetch(`http://localhost:8000/patient/${patientId}`);
  return await response.json();
}
```

### Update Profile
```javascript
async function updateProfile(patientId, profile) {
  const response = await fetch(`http://localhost:8000/patient/${patientId}/profile`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(profile)
  });
  return await response.json();
}

// Usage
await updateProfile('123', {
  name: 'Ahmed Mohamed',
  age: '45',
  gender: 'male',
  phone: '01012345678'
});
```

### Upload Image
```javascript
async function analyzeImage(file, userRole) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('user_role', userRole);
  
  const response = await fetch('http://localhost:8000/image/analyze', {
    method: 'POST',
    body: formData
  });
  return await response.json();
}
```

### Download PDF
```javascript
async function downloadReport(patientId, userRole) {
  const response = await fetch(
    `http://localhost:8000/report/${patientId}/doctor-report/pdf?user_role=${userRole}`
  );
  const blob = await response.blob();
  
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'medical_report.pdf';
  a.click();
  window.URL.revokeObjectURL(url);
}
```

---

# 9. COMPLETE TESTING GUIDE

## Step-by-Step Test Flow

Run these commands in order to test all functionality:

### Step 1: Start Server
```bash
cd "d:\University\Graduation Project\Final Folder\Agentic-Medical-RAG-Chatbot-main"
python -m uvicorn api.main:app --reload --port 8000
```

### Step 2: Health Check
```bash
curl http://localhost:8000/health
```

### Step 3: Create Patient
```bash
curl -X POST "http://localhost:8000/patient/test_user/profile" -H "Content-Type: application/json" -d "{\"name\": \"Test User\", \"age\": \"35\", \"gender\": \"male\", \"phone\": \"01000000000\"}"
```

### Step 4: Add Conditions
```bash
curl -X POST "http://localhost:8000/patient/test_user/conditions" -H "Content-Type: application/json" -d "{\"conditions\": [\"Diabetes Type 2\", \"Hypertension\"]}"
```

### Step 5: Add Medications
```bash
curl -X POST "http://localhost:8000/patient/test_user/medications" -H "Content-Type: application/json" -d "{\"medications\": [{\"name\": \"Metformin\", \"dosage\": \"1000mg\"}, {\"name\": \"Lisinopril\", \"dosage\": \"10mg\"}]}"
```

### Step 6: Add Family History
```bash
curl -X POST "http://localhost:8000/patient/test_user/family-history" -H "Content-Type: application/json" -d "{\"relation\": \"father\", \"condition\": \"Heart Disease\"}"
```

### Step 7: Get Patient Data
```bash
curl "http://localhost:8000/patient/test_user"
```

### Step 8: Get Summary
```bash
curl "http://localhost:8000/patient/test_user/summary"
```

### Step 9: Chat (Patient - Arabic)
```bash
curl -X POST "http://localhost:8000/chat/" -H "Content-Type: application/json" -d "{\"message\": \"ايه الاكل الممنوع عليا؟\", \"patient_id\": \"test_user\", \"user_role\": \"patient\"}"
```

### Step 10: Chat (Doctor - English)
```bash
curl -X POST "http://localhost:8000/chat/" -H "Content-Type: application/json" -d "{\"message\": \"What foods should this patient avoid?\", \"patient_id\": \"test_user\", \"user_role\": \"doctor\"}"
```

### Step 11: Generate Report (Patient - Arabic)
```bash
curl "http://localhost:8000/report/test_user/doctor-report?user_role=patient"
```

### Step 12: Generate Report (Doctor - English)
```bash
curl "http://localhost:8000/report/test_user/doctor-report?user_role=doctor"
```

### Step 13: Download PDF (Patient - Arabic)
```bash
curl "http://localhost:8000/report/test_user/doctor-report/pdf?user_role=patient" --output patient_report.pdf
```

### Step 14: Download PDF (Doctor - English)
```bash
curl "http://localhost:8000/report/test_user/doctor-report/pdf?user_role=doctor" --output doctor_report.pdf
```

### Step 15: Image Analysis (if you have an image)
```bash
curl -X POST "http://localhost:8000/image/analyze" -F "file=@test_image.jpg" -F "user_role=patient"
```

### Step 16: Cache Stats
```bash
curl "http://localhost:8000/cache/stats"
```

### Step 17: Cleanup Test Data
```bash
curl -X DELETE "http://localhost:8000/patient/test_user"
```

---

## Expected Results

| Step | Expected |
|------|----------|
| 2 | `{"status": "healthy"}` |
| 3-6 | `{"status": "success"}` |
| 7 | Patient data with all fields |
| 9 | Arabic response about food |
| 10 | English clinical response |
| 11 | Arabic report JSON |
| 12 | English report JSON |
| 13 | `patient_report.pdf` file created |
| 14 | `doctor_report.pdf` file created |

---

## Interactive API Docs

After starting the server:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Server won't start | Check `.env` file has valid API keys |
| Arabic text broken | Ensure `arabic-reshaper` and `python-bidi` installed |
| PDF won't generate | Check `reportlab` installed |
| Image analysis fails | Install `easyocr` and `opencv-python` |
| LLM timeout | Try different provider (Groq is fastest) |

---

## Contact & Support

For issues or questions, check the FastAPI docs at `/docs` or review the source code in `api/` and `src/` directories.
