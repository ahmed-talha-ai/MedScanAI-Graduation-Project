# 🏥 How to Run & Complete Setup Guide

This guide covers how to set up the .NET 8 backend, React frontend, and all 5 Python AI microservices locally.

### ✅ Prerequisites
* **Git** (For cloning the repo)
* **Node.js** (For the React frontend)
* **Microsoft SQL Server** (Local instance with Windows Auth, running on `Server=.`)
* **Visual Studio 2022+** (For the .NET 8 API)
* **.NET 8 SDK** (Installed)
* **Python 3.10+** (For the AI FastAPI servers)

---

### 🐍 STEP 1 — Set Up Python Virtual Environment & AI Services
All AI servers share the same virtual environment and `requirements.txt`.

1. Open a terminal (Anaconda Prompt recommended) in the root `Notebooks/` folder.
2. Create and activate a Conda virtual environment:
   ```powershell
   conda create -n mediscan python=3.10 -y
   conda activate mediscan
   ```
3. Install dependencies:
   ```powershell
   pip install -r requirements.txt
   ```
   *(Note: For GPU support, install PyTorch with CUDA manually first)*
4. Ensure the `.env` file exists inside `Agentic-Medical-RAG-Chatbot-main\` with your API keys (Groq, Gemini, HuggingFace, etc.).

**Start All 5 Python AI Servers:**
Open **5 separate terminal windows**, activate the virtual environment in each, and run these commands from the root folder:
* **Chatbot + Lab Analysis (port 8005):** `python -m uvicorn api.main:app --reload --port 8005 --app-dir "Agentic-Medical-RAG-Chatbot-main"`
* **Brain Tumor (port 8001):** `python -m uvicorn main:app --reload --port 8001 --app-dir "Brain Tumer"`
* **X-Ray (port 8002):** `python -m uvicorn main:app --reload --port 8002 --app-dir "X-ray"`
* **Breast Cancer (port 8006):** `python -m uvicorn main:app --reload --port 8006 --app-dir "Breast cancer"`
* **Dermatology / DermNet (port 8000):** `python -m uvicorn main:app --reload --port 8000 --app-dir "DermNet"`

---

### 🏗️ STEP 2 — Start the .NET 8 Backend

1. Open **Visual Studio 2022**.
2. Open the solution file: `MedScanAI-master\MedScanAI.sln`.
3. Open `MedScanAI.API\appsettings.json` and verify the connection string:
   ```json
   "ConnectionStrings": {  
     "DefaultConnection": "Server=.;Database=MedScanAI;Integrated Security=True;TrustServerCertificate=True;"  
   }
   ```
4. Go to **Tools → NuGet Package Manager → Package Manager Console**.
5. Set **Default Project** to `MedScanAI.Infrastructure`.
6. Run the following command to create the database and apply migrations:
   ```powershell
   Update-Database
   ```
7. Press **F5** or click **▶ Run** to start the backend. Swagger will open at `https://localhost:7196/swagger/index.html`.

---

### ⚛️ STEP 3 — Start the React Frontend

1. Open a new terminal.
2. Navigate to the frontend folder:
   ```powershell
   cd mediscan-web
   ```
3. Install dependencies:
   ```powershell
   npm install
   ```
4. Start the development server:
   ```powershell
   npm run dev
   ```
5. Open your browser and navigate to `http://localhost:3000`.

---

### 🧪 Test Accounts (Seeded Data)
You can log in to the platform using the following pre-seeded test accounts:

* **Admin:** `mazenabdelgawad700@gmail.com` / `String@1234`
* **Doctor:** `ali@gmail.com` / `String@1234`
* **Patient:** `malak@gmail.com` / `String@1234`
