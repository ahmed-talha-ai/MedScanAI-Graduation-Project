# 🏥 MedScanAI — Complete Run & Integration Guide

> How to start **everything** locally and have the .NET backend talk to all AI services.

---

## 🗺️ Architecture Overview

```
React Frontend (port 5173)
        │
        ▼
.NET 8 Backend API (port 7196)  ──── SQL Server (MedScanAI DB)
        │
        ├──► 🤖 RAG Chatbot + Lab Analysis  →  Python FastAPI (port 8005)
        ├──► 🧠 Brain Tumor                 →  Python FastAPI (port 8001)
        ├──► 🫁 X-Ray                       →  Python FastAPI (port 8002)
        ├──► 🔬 Breast Cancer               →  Python FastAPI (port 8006)
        └──► 🩺 Dermatology (DermNet)       →  Python FastAPI (port 8000)
```

The .NET backend does **NOT** run the AI itself — it calls the Python services via HTTP.
You must start **all five Python servers** before using the AI features.

---

## ✅ Prerequisites

| Tool                 | Notes                                                  |
| -------------------- | ------------------------------------------------------ |
| Git                  | For cloning                                            |
| Node.js              | For the React frontend                                 |
| Microsoft SQL Server | Local instance with Windows Auth                       |
| Visual Studio 2022+  | For the .NET project                                   |
| .NET 8 SDK           | https://dotnet.microsoft.com/en-us/download/dotnet/8.0 |
| Python 3.10+         | For all AI servers                                     |
| VS Code / any editor | Optional for Python files                              |

---

## 📁 Folder Structure (Your Local Paths)

```
d:\University\Graduation Project\Final Folder\Notebooks\
├── MedScanAI-master\               ← .NET 8 Backend
├── MedScanAIFrontEnd-main\         ← React Frontend
├── Agentic-Medical-RAG-Chatbot-main\ ← AI Chatbot + Lab (port 8005)
├── Brain Tumer\                    ← Brain Tumor model (port 8001)
├── X-ray\                          ← X-Ray model (port 8002)
├── Breast cancer\                  ← Breast Cancer model (port 8006)
├── DermNet\                        ← Dermatology model (port 8000)
├── models\                         ← All .keras / .pth model files
└── requirements.txt                ← Python dependencies
```

---

## 🐍 STEP 1 — Set Up Python Virtual Environment (One Time)

Open a terminal in:

```
d:\University\Graduation Project\Final Folder\Notebooks\
```

```powershell
# Create virtual environment
python -m venv mediscan

# Activate it (Windows PowerShell)
.\mediscan\Scripts\Activate.ps1

# Install all dependencies
pip install -r requirements.txt
```

> [!TIP]
> For GPU support, install PyTorch manually with CUDA first:
> `pip install torch==2.5.1+cu121 torchvision==0.20.1+cu121 --index-url https://download.pytorch.org/whl/cu121`

---

## 🔑 STEP 2 — Verify the `.env` File (Already Exists)

The `.env` file is inside `Agentic-Medical-RAG-Chatbot-main\`.
It already has API keys configured. **All 5 Python servers share this same `.env`.**

```
d:\University\Graduation Project\Final Folder\Notebooks\Agentic-Medical-RAG-Chatbot-main\.env
```

Current keys inside:

```env
OPENROUTER_API_KEY=sk-or-v1-...
GROQ_API_KEY=gsk_...
HUGGINGFACE_API_TOKEN=hf_...
TAVILY_API_KEY=tvly-dev-...
GEMINI_API_KEY=AIzaSy...
HF_TOKEN=hf_...
```

> [!IMPORTANT]
> The individual model servers (`Brain Tumer\main.py`, etc.) also read `.env`.
> Make sure you **run them from the `Notebooks\` root folder** (where Python finds `models/`) or they won't find model files.

---

## 🚀 STEP 3 — Start All 5 Python AI Servers

Open **5 separate terminal windows**, each activated with the venv:

```powershell
cd "d:\University\Graduation Project\Final Folder\Notebooks"
conda activate D:\envs\mediscan
```

Then in each terminal run one command:

### Terminal 1 — Chatbot + Lab Analysis (port 8005)

```powershell
cd "d:\University\Graduation Project\Final Folder\Notebooks"
python -m uvicorn api.main:app --reload --port 8005 --app-dir "Agentic-Medical-RAG-Chatbot-main"
```

### Terminal 2 — Brain Tumor (port 8001)

```powershell
cd "d:\University\Graduation Project\Final Folder\Notebooks"
python -m uvicorn main:app --reload --port 8001 --app-dir "Brain Tumer"
```

### Terminal 3 — X-Ray (port 8002)

```powershell
cd "d:\University\Graduation Project\Final Folder\Notebooks"
python -m uvicorn main:app --reload --port 8002 --app-dir "X-ray"
```

### Terminal 4 — Breast Cancer (port 8006)

```powershell
cd "d:\University\Graduation Project\Final Folder\Notebooks"
python -m uvicorn main:app --reload --port 8006 --app-dir "Breast cancer"
```

### Terminal 5 — Dermatology / DermNet (port 8000)

```powershell
cd "d:\University\Graduation Project\Final Folder\Notebooks"
python -m uvicorn main:app --reload --port 8000 --app-dir "DermNet"
```

---

## ✔️ STEP 4 — Verify All Python Servers Are Running

Open your browser and check each health endpoint:

| Service       | Health Check URL             |
| ------------- | ---------------------------- |
| Chatbot + Lab | http://localhost:8005/health |
| Brain Tumor   | http://localhost:8001/docs   |
| X-Ray         | http://localhost:8002/docs   |
| Breast Cancer | http://localhost:8006/docs   |
| Dermatology   | http://localhost:8000/docs   |

Expected response for Chatbot:

```json
{ "status": "ok", "message": "🏥 MediScan API is running" }
```

---

## 🏗️ STEP 5 — Start the .NET 8 Backend

1. Open **Visual Studio 2022**
2. Open solution: `MedScanAI-master\MedScanAI.sln`
3. Open `MedScanAI.API\appsettings.json` and verify your connection string:
   ```json
   "DefaultConnection": "Server=.;Database=MedScanAI;Integrated Security=True;TrustServerCertificate=True;"
   ```
4. Go to **Tools → NuGet Package Manager → Package Manager Console**
5. Set **Default Project** = `MedScanAI.Infrastructure`, then run:
   ```
   Update-Database
   ```
6. Press **F5** or click **▶ Run** — Swagger opens at:
   - https://localhost:7196/swagger/index.html

---

## ⚛️ STEP 6 — Start the React Frontend

```powershell
conda activate D:\envs\mediscan
cd "d:\University\Graduation Project\Final Folder\Notebooks\MedScanAIFrontEnd-main\medscanai"
npm install
npm run dev
or
cd "D:\University\Graduation Project\Final Folder\Notebooks\mediscan-web"
npm install
npm run dev
```

Frontend runs at: **http://localhost:5173/**

or Frontend runs at: **http://localhost:3000/**

---

## 🔗 How the Connection Works

The .NET `AIService.cs` calls each Python server via HTTP internally.
No configuration change needed — the URLs are **hardcoded** in the service:

| .NET Call                             | Calls Python on                                     |
| ------------------------------------- | --------------------------------------------------- |
| `GetChatbotResponseAsync`           | `http://localhost:8005/chat`                      |
| `GetLabResultsModelResponseAsync`   | `http://localhost:8005/images/analyze`            |
| `GenerateMedicalReportAsync`        | `http://localhost:8005/report/{id}/doctor-report` |
| `GetBrainTumorModelResponseAsync`   | `http://localhost:8001/predict`                   |
| `GetXRayModelResponseAsync`         | `http://localhost:8002/predict`                   |
| `GetBreastCancerModelResponseAsync` | `http://localhost:8006/predict`                   |
| `GetDermatologyModelResponseAsync`  | `http://localhost:8000/predict`                   |

> [!NOTE]
> The .NET backend uses `HttpClient` to proxy requests — the frontend never calls Python directly. Everything goes through .NET first.

---

## 🧪 Test Accounts

| Role    | Email                        | Password    |
| ------- | ---------------------------- | ----------- |
| Admin   | mazenabdelgawad700@gmail.com | String@1234 |
| Doctor  | ali@gmail.com                | String@1234 |
| Patient | malak@gmail.com              | String@1234 |

---

## ⚠️ Common Issues

| Problem                        | Solution                                                                    |
| ------------------------------ | --------------------------------------------------------------------------- |
| Python server won't start      | Activate venv first:`.\mediscan\Scripts\Activate.ps1`                     |
| `Model file not found` error | Run servers from `Notebooks\` root, not from the subfolder                |
| .NET can't reach Python        | Make sure the Python server for that feature is running on the correct port |
| `Update-Database` fails      | Make sure SQL Server is running and Windows Auth is enabled                 |
| Port already in use            | Check with `netstat -ano \| findstr :8001` and kill the process            |
| Python slow on first request   | Normal — models load into memory on the first call                         |

---

## 📋 Full Startup Checklist

- [ ] SQL Server is running
- [ ] Virtual environment activated in all 5 Python terminals
- [ ] All 5 Python servers started on correct ports
- [ ] All 5 health/docs URLs return 200 OK
- [ ] .NET backend started (Swagger accessible)
- [ ] React frontend started (`npm run dev`)
- [ ] Login tested with a seeded account
