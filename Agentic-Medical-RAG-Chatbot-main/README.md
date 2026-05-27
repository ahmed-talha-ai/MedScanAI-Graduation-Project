# 🏥 MediScan - Agentic Medical RAG Chatbot

An AI-powered medical assistant that combines **Retrieval-Augmented Generation (RAG)**, **medical image analysis**, and **OCR** to provide intelligent medical consultations in **Arabic (Egyptian dialect)**.

---

## 📋 Table of Contents

- [Features](#-features)
- [Prerequisites](#-prerequisites)
- [Complete Installation Guide](#-complete-installation-guide)
- [Environment Setup](#-environment-setup)
- [Running the Application](#-running-the-application)
- [Project Structure](#-project-structure)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Features

- 🤖 **Agentic RAG System** - Intelligent retrieval with LangGraph agents
- 🩺 **Medical Image Analysis** - Skin disease & brain tumor classification
- 📄 **OCR for Lab Reports** - Extract text from medical documents (Arabic/English)
- 💬 **Bilingual Support** - Arabic (Egyptian) and English responses
- 🔍 **Hybrid Search** - Semantic + BM25 retrieval for accurate results
- 📊 **Medical Report Generation** - PDF reports with analysis results

---

## 🔧 Prerequisites

### Required Software

| Software | Version | Download Link |
|----------|---------|---------------|
| **Python** | 3.10 - 3.11 | https://www.python.org/downloads/ |
| **Git** | Latest | https://git-scm.com/downloads |
| **Tesseract OCR** | 5.0+ | See installation below |

### Optional (For GPU Acceleration)

| Software | Version | Download Link |
|----------|---------|---------------|
| **NVIDIA Driver** | Latest | https://www.nvidia.com/drivers |
| **CUDA Toolkit** | 11.8 - 12.6 | https://developer.nvidia.com/cuda-toolkit |

---

## 📦 Complete Installation Guide

### 📌 Step 1: Install Python

1. Download Python 3.10 or 3.11 from https://www.python.org/downloads/
2. **During installation**: ✅ Check "Add Python to PATH"
3. Verify installation:

```bash
python --version
# Expected: Python 3.10.x or 3.11.x
```

---

### 📌 Step 2: Install Tesseract OCR (Required for Lab Report OCR)

#### Windows Installation:

1. Download installer from: https://github.com/UB-Mannheim/tesseract/wiki
2. Run the installer
3. **Important**: During installation:
   - Note the installation path (default: `C:\Program Files\Tesseract-OCR`)
   - Under "Additional language data", select **Arabic** language pack
4. Add Tesseract to System PATH:
   - Open "Environment Variables" (search in Start menu)
   - Under "System Variables", find `Path` and click "Edit"
   - Click "New" and add: `C:\Program Files\Tesseract-OCR`
   - Click "OK" to save

5. Verify installation (restart terminal first):

```bash
tesseract --version
# Expected: tesseract 5.x.x
```

---

### � Step 3: Clone/Navigate to Project

```bash
# If you have the project folder already:
cd "d:\University\Graduation Project\Final Folder\Agentic-Medical-RAG-Chatbot-main"

# Or clone from repository:
# git clone <repository-url>
# cd Agentic-Medical-RAG-Chatbot-main
```

---

### 📌 Step 4: Create Virtual Environment

```bash
# Create virtual environment
python -m venv mediscan

# Activate on Windows (Command Prompt)
mediscan\Scripts\activate

# Activate on Windows (PowerShell)
mediscan\Scripts\Activate.ps1

# Activate on Linux/Mac
source mediscan/bin/activate
```

> ✅ You should see `(mediscan)` at the beginning of your terminal prompt

---

### 📌 Step 5: Install Base Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

---

### 📌 Step 6: Install PyTorch (Choose ONE Option)

---

## 🅰️ Option A: CPU Only Installation (No NVIDIA GPU)

Use this if you **don't have an NVIDIA GPU** or don't want to use CUDA.

```bash
# Install PyTorch CPU version
pip install torch torchvision torchaudio
```

**Verify CPU Installation:**

```bash
python -c "import torch; print(f'PyTorch Version: {torch.__version__}'); print(f'CUDA Available: {torch.cuda.is_available()}')"
```

**Expected Output:**
```
PyTorch Version: 2.x.x
CUDA Available: False
```

> 💡 **Note**: CPU mode works perfectly fine! Image analysis will just be slightly slower.

---

## 🅱️ Option B: CUDA/GPU Installation (NVIDIA GPU Users)

Use this if you **have an NVIDIA GPU** and want faster image processing.

### B.1: Check Your CUDA Version

First, check if CUDA is installed and what version you have:

```bash
# Check NVIDIA driver and CUDA version
nvidia-smi
```

Look for "CUDA Version" in the output (e.g., CUDA Version: 12.6)

```bash
# Check CUDA compiler version (if CUDA Toolkit installed)
nvcc --version
```

### B.2: Install CUDA Toolkit (If Not Installed)

If `nvcc --version` fails, install CUDA Toolkit:

1. Go to: https://developer.nvidia.com/cuda-toolkit
2. Download CUDA Toolkit 12.1 or 12.4 (recommended)
3. Run installer with default options
4. Restart your computer
5. Verify: `nvcc --version`

### B.3: Install PyTorch with CUDA

**First, uninstall any existing PyTorch:**

```bash
pip uninstall torch torchvision torchaudio -y
```

**Then install PyTorch with CUDA support:**

| Your CUDA Version | Install Command |
|-------------------|-----------------|
| CUDA 11.8 | `pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118` |
| CUDA 12.1 | `pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121` |
| CUDA 12.4+ | `pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124` |

**Example for CUDA 12.1 - 12.6:**

```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

### B.4: Verify CUDA Installation

```bash
python -c "import torch; print(f'PyTorch Version: {torch.__version__}'); print(f'CUDA Available: {torch.cuda.is_available()}'); print(f'CUDA Version: {torch.version.cuda}'); print(f'GPU Name: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else \"N/A\"}')"
```

**Expected Output (GPU):**
```
PyTorch Version: 2.x.x+cu121
CUDA Available: True
CUDA Version: 12.1
GPU Name: NVIDIA GeForce RTX XXXX
```

---

## 🔐 Environment Setup

### Create `.env` File

Create a file named `.env` in the project root directory:

```env
# === Required: At least ONE LLM API Key ===
GROQ_API_KEY=your_groq_api_key_here
GOOGLE_API_KEY=your_google_gemini_api_key_here

# === Optional ===
OPENAI_API_KEY=your_openai_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
```

### Get Your API Keys

| Service | Purpose | Get Key | Required? |
|---------|---------|---------|-----------|
| **Groq** | Fast LLM inference | https://console.groq.com/keys | ✅ Recommended |
| **Google AI** | Gemini models | https://aistudio.google.com/apikey | ✅ Recommended |
| **OpenAI** | GPT models | https://platform.openai.com/api-keys | ❌ Optional |
| **Tavily** | Web search | https://tavily.com/ | ❌ Optional |

> ⚠️ **You need at least ONE of**: `GROQ_API_KEY` or `GOOGLE_API_KEY`

---

## 🚀 Running the Application

### Activate Environment First

```bash
# Windows Command Prompt
mediscan\Scripts\activate

# Windows PowerShell
mediscan\Scripts\Activate.ps1
```

### Option 1: Gradio Web Interface (Recommended)

```bash
python src/app.py
```

Open in browser: **http://localhost:7860**

### Option 2: FastAPI Backend

```bash
python api/main.py
```

- API: **http://localhost:8000**
- Docs: **http://localhost:8000/docs**

---

## 📁 Project Structure

```
Agentic-Medical-RAG-Chatbot-main/
├── 📂 api/                    # FastAPI backend
│   ├── main.py               # API entry point
│   ├── medical_report.py     # PDF report generation
│   └── ...
├── 📂 src/                    # Core application
│   ├── app.py                # Gradio interface
│   ├── config.py             # Configuration
│   ├── tools.py              # LangGraph tools
│   ├── agents.py             # RAG agents
│   ├── image_analysis.py     # Medical image AI
│   ├── ocr.py                # OCR processing
│   └── ...
├── 📂 data/                   # Knowledge base
├── 📂 models/                 # ML models
├── 📄 requirements.txt        # Dependencies
├── 📄 .env                    # API keys (create this)
└── 📄 README.md              # This file
```

---

## ❓ Troubleshooting

### Installation Issues

| Problem | Solution |
|---------|----------|
| `python` not recognized | Reinstall Python with "Add to PATH" checked |
| `pip` not recognized | Run `python -m pip install ...` instead |
| `tesseract` not found | Add `C:\Program Files\Tesseract-OCR` to PATH |
| Package conflicts | Delete `mediscan` folder and recreate environment |

### PyTorch/CUDA Issues

| Problem | Solution |
|---------|----------|
| `CUDA Available: False` | Reinstall PyTorch with correct CUDA version |
| CUDA out of memory | Reduce batch size or use CPU mode |
| `nvidia-smi` not found | Install/update NVIDIA drivers |
| Wrong CUDA version | Uninstall PyTorch and reinstall with correct `cu###` |

### Runtime Issues

| Problem | Solution |
|---------|----------|
| API key errors | Check `.env` file exists with valid keys |
| Import errors | Run `pip install -r requirements.txt` again |
| Port in use | Change port or kill existing process |

### Quick Diagnostic Commands

```bash
# Check Python
python --version

# Check all packages
pip list

# Check PyTorch & CUDA
python -c "import torch; print(torch.cuda.is_available())"

# Check Tesseract
tesseract --version

# Check all imports
python -c "import torch; import langchain; import gradio; import easyocr; print('✅ All imports OK!')"
```

---

## 📚 API Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference.

---

## 🔧 For Backend/Frontend Developers

See **[BACKEND_GUIDE.md](./BACKEND_GUIDE.md)** for:
- ⚡ Quick Start (5 minutes)
- 💻 JavaScript/TypeScript examples
- 🔗 All API endpoints with examples
- ⚠️ Error handling guide
- 🧪 Testing checklist

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React/Vue)                      │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTP/REST
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FastAPI Backend (port 8000)                   │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐     │
│  │   /chat/    │  /images/   │  /patient/  │  /report/   │     │
│  │   Chatbot   │   Analysis  │   CRUD      │   AI PDF    │     │
│  └──────┬──────┴──────┬──────┴──────┬──────┴──────┬──────┘     │
└─────────┼─────────────┼─────────────┼─────────────┼─────────────┘
          │             │             │             │
          ▼             ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Core Services                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │ RAG Agent   │ │ Image AI    │ │ Patient DB  │ │ PDF Gen   │ │
│  │ (LangGraph) │ │ (EasyOCR)   │ │ (JSON)      │ │(ReportLab)│ │
│  └──────┬──────┘ └──────┬──────┘ └─────────────┘ └───────────┘ │
│         │               │                                        │
│         ▼               ▼                                        │
│  ┌─────────────┐ ┌─────────────┐                                │
│  │ FAISS       │ │ ML Models   │                                │
│  │ Vector DB   │ │ (Skin/Brain)│                                │
│  └─────────────┘ └─────────────┘                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LLM Providers (External)                      │
│         Groq API  |  Google Gemini  |  OpenAI  |  OpenRouter    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔗 Quick API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/chat/` | POST | Chat with AI assistant |
| `/images/analyze` | POST | Analyze medical image |
| `/patient/{id}` | GET | Get patient data |
| `/patient/{id}/profile` | POST | Update patient profile |
| `/patient/{id}/conditions` | POST | Add conditions |
| `/patient/{id}/medications` | POST | Add medications |
| `/report/{id}/doctor-report` | GET | Get AI report (JSON) |
| `/report/{id}/doctor-report/pdf` | GET | Download report PDF |

**Full API Docs**: http://localhost:8000/docs (after starting server)

---

**Built with ❤️ for Medical AI Research**
