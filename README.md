# MediScan — AI-Powered Medical Diagnostic Platform

> **Future Brand Name:** Sebar (سِبَار) — a unified Arabic-branded health intelligence platform.

---

## What Is This Project?

MediScan is a full-stack medical diagnostic platform that uses deep learning to help clinicians and patients analyze medical images across four critical domains: skin diseases, brain tumors, breast cancer, and chest X-ray abnormalities. The system is designed as a graduation project and serves as a working proof-of-concept for how artificial intelligence can be woven into everyday clinical workflows without replacing the human judgment of doctors.

The platform is not a single model or a single app. It is a complete ecosystem — a .NET 8 backend with CQRS architecture, a React.js web dashboard, a Flutter mobile application, and four independent FastAPI-based AI microservices, each responsible for one diagnostic domain. Patients can upload medical images through the web or mobile interface, and the system returns a prediction along with confidence scores and recommended next steps.

---

## Why "MediScan" and Why "Sebar"?

The project was developed under the name **MediScan** for the academic submission. However, the long-term vision is to rebrand the platform as **Sebar (سِبَار)**, an Arabic name that carries a sense of exploration and deep investigation — fitting for a diagnostic tool. The rebranding will also align with the addition of a comprehensive Pediatric Health module and localization for Arabic-speaking healthcare markets.

The Children's Health features (BMI calculators, vaccination trackers, fever dosage calculators, developmental milestone tests, growth monitoring) have already been implemented in the Flutter mobile application as a proof-of-concept. The web integration of these features is planned as immediate future work.

---

## System Architecture at a Glance

The platform follows a microservices architecture with clear separation between concerns:

- **Backend API:** ASP.NET Core (.NET 8), CQRS pattern with MediatR, Entity Framework Core, SQL Server
- **Web Frontend:** React.js with Vite, role-based dashboards for Patients, Doctors, and Admins
- **Mobile App:** Flutter (Dart), BLoC/Cubit state management, SharedPreferences for local persistence
- **AI Services:** Four independent FastAPI microservices (Python), each serving one diagnostic model
- **Authentication:** JWT-based with role claims (Patient, Doctor, Admin)

Each AI microservice exposes a simple REST endpoint that accepts a Base64-encoded image and returns a JSON response with the predicted class, confidence score, and associated medical guidance.

---

## The Four Diagnostic Models

### 1. Skin Disease Classifier (DermNet — ViT-Base/16 Ensemble)

- **Dataset:** DermNet (16 dermatological categories)
- **Architecture:** Dual Vision Transformer (ViT-Base/16) ensemble
- **Preprocessing:** CLAHE enhancement in LAB color space
- **Test Accuracy:** 97.93%
- **Key Innovation:** The dual-ViT ensemble uses a winner-takes-all strategy — both models independently classify the image, and the prediction with the higher confidence is chosen. This eliminates low-confidence guesses and pushes the overall accuracy above any single-model baseline.

The 16 classes cover conditions ranging from Acne and Rosacea to Melanoma, Psoriasis, Vasculitis, and Vascular Tumors. A 7-class variant was developed first as a proof-of-concept and then scaled to the full 16-class production model.

### 2. Brain Tumor Detector (Xception)

- **Dataset:** Brain MRI scans (4 classes: Glioma, Meningioma, No Tumor, Pituitary)
- **Architecture:** Xception with ImageNet pre-trained weights
- **Training Strategy:** Two-phase — frozen backbone followed by full fine-tuning
- **Test Accuracy:** 99.39%
- **Key Insight:** The Xception model's depthwise separable convolutions are particularly well-suited for MRI data because they capture both fine-grained edge patterns (tumor boundaries) and broader structural features (brain hemispheres) without the parameter overhead of standard convolutions.

### 3. Breast Cancer Detector (DenseNet121 with V16 Multi-Fusion)

- **Dataset:** INbreast mammogram dataset
- **Architecture:** DenseNet121 with a custom V16 Multi-Fusion preprocessing pipeline
- **Training Strategy:** Three-phase progressive unfreezing with Focal Loss
- **Test Accuracy:** 97.15% | AUC: 99.36%
- **Key Innovation:** The V16 Multi-Fusion pipeline stacks three processed versions of each mammogram into a single pseudo-RGB image:
  - **Red channel:** CLAHE-enhanced contrast
  - **Green channel:** High-boost filtered edges
  - **Blue channel:** Inverted intensity map

  This forces the model to simultaneously learn from contrast patterns, edge features, and density distributions — three complementary views that no single preprocessing step can provide.

### 4. Chest X-Ray Analyzer (EfficientNetV2-L)

- **Dataset:** Chest X-Ray images (4 classes: COVID-19, Normal, Viral Pneumonia, Lung Opacity)
- **Architecture:** EfficientNetV2-Large with custom two-layer classifier head
- **Training Strategy:** Two-phase with MixUp/CutMix regularization
- **Test Accuracy:** 96.46% | Macro F1: 97.09% (with TTA)
- **Key Innovation:** Test-Time Augmentation (TTA) with 5 augmented views at inference time boosts Macro F1 from 96.76% to 97.34% without any additional training.

---

## Model Performance Visualization Charts

All 37 visualization charts generated during model training and evaluation are stored in the `Model Visualization Charts/` directory. These charts are the primary evidence for the Model Evaluation chapter of the thesis documentation.

### DermNet (Skin Disease) — 14 Charts

| Chart File | Description |
|------------|-------------|
| `7 Class DermNet dynamics Curves.png` | Training and validation loss/accuracy curves for the 7-class model |
| `7 Class DermNet training_curves_vit_balanced.png` | Balanced training curves with class-weighted sampling |
| `7 Class DermNet Model Evolution - start vs best epoch.png` | Metric improvement from first epoch to best epoch |
| `7 Class DermNet confusion_matrix_vit_balanced.png` | 7x7 confusion matrix on the test set |
| `7 Class DermNet Detailed Performance Metrix per Class.png` | Precision/Recall/F1 heatmap for each class |
| `7 Class DermNet Final f1-score_ per class_ranking.png` | Classes ranked by F1-Score |
| `7 Class DermNet Class performance relative to average F1-score.png` | Deviation from average F1 per class |
| `16 Class DermNet viz_1_training_dynamics.png` | Training dynamics for the 16-class production model |
| `16 Class DermNet training_curves_vit_balanced.png` | Balanced training curves for 16 classes |
| `16 Class DermNet Model Evolution -  start vs best epoch.png` | Start-to-best epoch comparison |
| `16 Class DermNet confusion_matrix_vit_balanced.png` | 16x16 confusion matrix |
| `16 Class DermNet Detailed Performance Metrix per Class.png` | Per-class metrics heatmap |
| `16 Class DermNet Final f1-score_ per class_ranking.png` | F1-Score ranking across all 16 classes |
| `16 Class DermNet Class performance relative to average F1-score.png` | Relative F1 deviation chart |

### Brain Tumor — 6 Charts

| Chart File | Description |
|------------|-------------|
| `brain_dynamics.png` | Two-phase training dynamics (loss and accuracy) |
| `Brain Tumer Class distribution bar chart.png` | Dataset class balance visualization |
| `Brain Tumer Confusion metrix.png` | Confusion matrix with raw counts |
| `Brain Tumer Confusion metrix %.png` | Normalized percentage confusion matrix |
| `brain_summary.png` | Train/Val/Test accuracy and loss summary |
| `brain_heatmap.png` | Per-class Precision/Recall/F1 heatmap |

### Breast Cancer — 9 Charts

| Chart File | Description |
|------------|-------------|
| `breast_dynamics.png` | Three-phase progressive training (AUC over epochs) |
| `breast_cm.png` | 2x2 confusion matrix (Benign vs. Malignant) |
| `breast_summary.png` | Overall test performance bar chart (7 metrics) |
| `breast_heatmap.png` | Per-class metrics heatmap |
| `Breast Cancer results_v16.png` | Combined CM + ROC + Precision-Recall panel |
| `Breast Cancer augmentation_preview_v16.png` | Augmentation strategy preview grid |
| `Breast Cancer high_confidence_samples_v16.png` | Highest-confidence correct predictions |
| `Breast Cancer raw_top_confidence_grid.png` | Raw (no V16) confidence grid |
| `Breast Cancer top_confidence_grid_v16.png` | V16-processed confidence grid |

### Chest X-Ray — 8 Charts

| Chart File | Description |
|------------|-------------|
| `xray_dynamics.png` | Two-phase training with MixUp/CutMix transition |
| `xray_evolution.png` | Start vs. best epoch metric comparison |
| `X-Ray Confusion Matrix.png` | 4x4 test set confusion matrix |
| `X-Ray Curves.png` | Standard training/validation curves |
| `xray_heatmap.png` | Per-class Precision/Recall/F1 heatmap |
| `xray_ranked_f1.png` | F1-Score ranking by class |
| `xray_relative_f1.png` | Relative F1 deviation from average |
| `xray_tta.png` | TTA comparison (No TTA vs. 5-aug vs. 10-aug) |

---

## Comparison with Published Research

We benchmarked our four models against 15 recent papers that tackled similar tasks on the same or comparable datasets.

| Domain | Best Published Accuracy | Our Accuracy | Improvement |
|--------|------------------------|--------------|-------------|
| Skin Disease (DermNet) | 97.0% (BASNet + CCTM) | **97.93%** | +0.93% |
| Brain Tumor (MRI) | 98.0% (VGG-16) | **99.39%** | +1.39% |
| Breast Cancer (INbreast) | 95.8% (EfficientNet-B3 + CLAHE) | **97.15%** | +1.35% |
| Chest X-Ray (4-class) | 95.2% (Inception-V3) | **96.46%** | +1.26% |

All four models exceed the best published accuracy in their respective domains.

---

## Platform Features

### For Patients
- Upload medical images and receive AI-powered diagnostic suggestions with confidence scores
- View personal medical history and past diagnostic results
- Book appointments with doctors directly through the platform
- Access Children's Health tools (mobile only): BMI calculator, symptom checker, vaccination tracker, fever dosage calculator, developmental milestones test, growth monitoring (WHO charts), solid food guide, and first aid hub
- Follow guided self-examination steps for brain tumor awareness and breast cancer screening

### For Doctors
- View patient lists and access their complete diagnostic history
- Review AI predictions and add clinical notes
- Manage appointments and patient records

### For Admins
- Full system management dashboard
- Doctor onboarding and account management
- Walk-in appointment booking
- System settings and configuration

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Backend API | ASP.NET Core (.NET 8) | RESTful API with CQRS/MediatR |
| Database | SQL Server + EF Core | Data persistence and migrations |
| Web Frontend | React.js + Vite | Patient/Doctor/Admin dashboards |
| Mobile App | Flutter (Dart) | Cross-platform mobile client |
| State Management | BLoC/Cubit | Flutter state management |
| AI Services | FastAPI + PyTorch | Four diagnostic microservices |
| Authentication | JWT | Role-based access control |

---

## Children's Health Module (Pediatric Hub)

The Pediatric Health module was originally planned as a future feature, but the core functionality was implemented ahead of schedule in the Flutter mobile application. It currently includes:

1. **Child BMI Calculator** — Calculates BMI and plots against age/gender percentile charts
2. **Child Symptom Checker** — Rule-based symptom assessment for common pediatric conditions
3. **Developmental Milestones Test** — Tracks age-appropriate developmental milestones
4. **Fever Dosage Calculator** — Calculates safe medication dosages based on child weight and age
5. **First Aid Hub** — Quick-reference guide for common childhood emergencies
6. **Growth Tracker (WHO)** — Plots height/weight against WHO growth standards
7. **Smart Vaccination Tracker** — Manages vaccination schedules with reminders
8. **Solid Food Guide** — Age-appropriate food introduction recommendations

These features are currently available only in the mobile app. Web integration is planned as the next milestone.

---

## Future Work & Roadmap

1. **Platform Rebranding to Sebar (سِبَار):** Full rebranding across all platforms, Arabic localization, new visual identity, and domain registration.
2. **Pediatric Web Integration:** Port the Children's Health module from Flutter to the React.js web dashboard.
3. **Model Improvements:** Expand DermNet to 23+ classes, add Grad-CAM overlays, implement model versioning.
4. **Clinical Integration:** HL7/FHIR compatibility, DICOM support, digital pathology.
5. **Security and Compliance:** HIPAA audit, end-to-end encryption, audit logging.

---

## Project Structure

```
MediScan/
├── Backend/                          # ASP.NET Core Web API
│   ├── Controllers/                  # API endpoints
│   ├── Application/                  # CQRS commands/queries (MediatR)
│   ├── Domain/                       # Entity models
│   └── Infrastructure/               # EF Core, repositories, JWT
├── Frontend/                         # React.js + Vite
│   ├── src/
│   │   ├── components/               # Reusable UI components
│   │   ├── pages/                    # Role-based dashboards
│   │   └── services/                 # API client services
├── MobileApp/                        # Flutter
│   ├── lib/
│   │   ├── cubits/                   # BLoC/Cubit state management
│   │   ├── screens/                  # All UI screens
│   │   └── services/                 # API integration
├── AI_Services/                      # FastAPI microservices
│   ├── dermnet_service/              # Skin disease classifier
│   ├── brain_tumor_service/          # Brain tumor detector
│   ├── breast_cancer_service/        # Breast cancer detector
│   └── xray_service/                 # Chest X-ray analyzer
├── Model Visualization Charts/       # 37 evaluation charts
└── README.md                         # This file
```

---

## 🚀 How to Run & Setup

For a complete, step-by-step guide on how to run the .NET 8 backend, React frontend, and all 5 Python AI microservices locally, please see the [**Setup Guide (SETUP_GUIDE.md)**](SETUP_GUIDE.md).

---

## License
This project is developed for academic purposes as part of a university graduation project. All rights reserved.
