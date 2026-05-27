# Phase 3 — Patient Profile, Reports, Forbidden Medicines & Children's Health

## Summary

Phase 3 adds 4 major feature areas: **Patient Profile CRUD** with medical history management, **AI Medical Report** generation with PDF download, **Forbidden Medicines** safety checker, and a 9-tool **Children's Health Suite** (all offline). This phase introduces ~30 new files and modifies ~5 existing ones.

---

## Verified Endpoint Map (from C# source code)

All endpoints verified against the actual controller files. The route pattern is `api/{controller}/[action]`.

### .NET Backend (port 7196)

| Feature | Method | URL | Body/Payload | Source |
|---------|--------|-----|--------------|--------|
| Get profile | POST | `/api/patient/GetProfile` | `{ patientId }` | [PatientController.cs](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.API/Controllers/PatientController.cs) |
| Update profile | PUT | `/api/patient/UpdateProfile` | `{ id, fullName?, email?, phoneNumber?, gender?, dateOfBirth? }` | [UpdatePatientProfileCommand.cs](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.Core/Features/PatientFeature/Command/Model/UpdatePatientProfileCommand.cs) |
| Add allergy | POST | `/api/allergy/AddAllergy` | `{ patientId, name }` | [AllergyController.cs](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.API/Controllers/AllergyController.cs) |
| Delete allergy | DELETE | `/api/allergy/DeleteAllergy` | `{ id }` | [DeletePatientAllergyCommand.cs](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.Core/Features/AllergyFeature/Command/Model/DeletePatientAllergyCommand.cs) |
| Add chronic disease | POST | `/api/chronicdisease/AddChronicDisease` | `{ patientId, name }` | [ChronicDiseaseController.cs](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.API/Controllers/ChronicDiseaseController.cs) |
| Delete chronic disease | DELETE | `/api/chronicdisease/DeleteChronicDisease` | `{ id }` | [DeletePatientChronicDiseaseCommand.cs](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.Core/Features/ChronicDiseaseFeature/Command/Model/DeletePatientChronicDiseaseCommand.cs) |
| Add medication | POST | `/api/currentmedication/AddCurrentMedication` | `{ patientId, name }` | [CurrentMedicationController.cs](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.API/Controllers/CurrentMedicationController.cs) |
| Delete medication | DELETE | `/api/currentmedication/DeleteCurrentMedication` | `{ id }` | [DeletePatientCurrentMedicationCommand.cs](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.Core/Features/PatientFeature/Command/Model/DeletePatientCurrentMedicationCommand.cs) |
| Generate AI report | POST | `/api/ai/GenerateMedicalReport` | `{ patientId }` | [AIController.cs](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.API/Controllers/AIController.cs#L62-L68) |

> [!IMPORTANT]
> The `GenerateMedicalReport` endpoint is on `AIController`, NOT a separate ReportController. It takes `{ patientId }` and returns `ReturnBase<bool>`. This means the .NET backend generates and stores the report, but does NOT return the report text. The actual AI-generated report content comes from the **Python RAG service** (port 8000).

### Python RAG Service (port 8000)

| Feature | Method | URL | Params | Source |
|---------|--------|-----|--------|--------|
| AI Report (JSON) | GET | `http://localhost:8000/report/{patientId}/doctor-report` | `?user_role=patient\|doctor` | [API_DOCUMENTATION.md](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/Agentic-Medical-RAG-Chatbot-main/API_DOCUMENTATION.md#L430-L452) |
| AI Report (PDF) | GET | `http://localhost:8000/report/{patientId}/doctor-report/pdf` | `?user_role=patient\|doctor` | [API_DOCUMENTATION.md](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/Agentic-Medical-RAG-Chatbot-main/API_DOCUMENTATION.md#L456-L470) |
| Patient warnings (NAM) | GET | `http://localhost:8000/patient/{patientId}/warnings` | — | [API_ENDPOINTS.md](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/Agentic-Medical-RAG-Chatbot-main/API_ENDPOINTS.md#L169-L210) |

---

## User Review Required

> [!IMPORTANT]
> **AI Report flow is split across two backends.** The .NET `GenerateMedicalReport` endpoint stores the report trigger, but the actual text/PDF comes from the Python RAG service at port 8000. My plan calls the Python RAG endpoints directly for report generation and PDF download. Confirm this is the intended architecture.

> [!WARNING]
> **Forbidden Medicines / NAM Report:** The Python service has a `GET /patient/{patientId}/warnings` endpoint that returns drug interactions and allergy warnings with severity levels. There is NO dedicated "Forbidden Medicines" endpoint — the warnings endpoint IS the NAM data source. I will use this as the API source, with hardcoded offline fallback data for when the service is unreachable. Confirm this approach.

## Open Questions

1. **Report generation flow:** Should the frontend call `POST /api/ai/GenerateMedicalReport` first (to trigger .NET to sync patient data to RAG), then call the Python `GET /report/{patientId}/doctor-report?user_role=patient` to get the text? Or should it call the Python endpoint directly? My plan assumes **direct Python call** since that's where the text comes from.

2. **Children's Health Suite navigation:** Should the 9 tools appear under a new `Children's Health` nav link in the sidebar (at `/dashboard/children`), or as a section within the existing profile page? My plan adds a new nav item.

---

## Proposed Changes

### Component 1: API Layer — Types & Services

---

#### [MODIFY] [api.ts](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/types/api.ts)

Add ~15 new interfaces:

```typescript
// Profile update payload (matches UpdatePatientProfileCommand.cs)
UpdatePatientProfilePayload { id, fullName?, email?, phoneNumber?, gender?, dateOfBirth? }

// Medical history CRUD payloads
AddMedicalHistoryPayload { patientId, name }
DeleteMedicalHistoryPayload { id }

// AI Report response (from Python RAG service)
MedicalReportResponse { status, patient_id, report, generated_at, profile_based? }

// Patient Warnings / NAM (from Python RAG service)
PatientWarning { type, severity, message }
PatientWarningsResponse { status, patient_id, warnings: PatientWarning[] }

// Children's Health (localStorage, client-side only)
GrowthEntry, VaccinationEntry, MilestoneEntry, etc.
```

---

#### [MODIFY] [patientService.ts](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/services/patientService.ts)

Expand from 1 method to 8 methods:

| Method | Endpoint |
|--------|----------|
| `getProfile(patientId)` | `POST /api/patient/GetProfile` (exists) |
| `updateProfile(payload)` | `PUT /api/patient/UpdateProfile` |
| `addAllergy({ patientId, name })` | `POST /api/allergy/AddAllergy` |
| `deleteAllergy({ id })` | `DELETE /api/allergy/DeleteAllergy` |
| `addChronicDisease({ patientId, name })` | `POST /api/chronicdisease/AddChronicDisease` |
| `deleteChronicDisease({ id })` | `DELETE /api/chronicdisease/DeleteChronicDisease` |
| `addMedication({ patientId, name })` | `POST /api/currentmedication/AddCurrentMedication` |
| `deleteMedication({ id })` | `DELETE /api/currentmedication/DeleteCurrentMedication` |

---

#### [NEW] reportService.ts

```
src/services/reportService.ts
```

Calls the Python RAG service **directly** (not through .NET proxy):

| Method | Target |
|--------|--------|
| `generateReport(patientId, userRole)` | `GET http://localhost:8000/report/{patientId}/doctor-report?user_role={role}` |
| `downloadReportPdf(patientId, userRole)` | `GET http://localhost:8000/report/{patientId}/doctor-report/pdf?user_role={role}` → blob download |
| `getWarnings(patientId)` | `GET http://localhost:8000/patient/{patientId}/warnings` |

Uses a separate Axios instance (no auth token, different baseURL, port 8000).

---

### Component 2: Patient Profile & Medical History Page

---

#### [NEW] profile layout.tsx

```
src/app/[locale]/(app)/dashboard/profile/layout.tsx
```

Simple metadata wrapper.

---

#### [NEW] profile page.tsx (~350 lines)

```
src/app/[locale]/(app)/dashboard/profile/page.tsx
```

Split into 3 sections:

**A. Profile Card (top):** Displays `fullName`, `email`, `phoneNumber`, `gender`, `dateOfBirth`. Edit button opens an inline form (no modal). Calls `PUT /api/patient/UpdateProfile`.

**B. Medical History (middle):** Three columns rendered as color-coded pill-tag sections:
- **Chronic Diseases** — `bg-secondary/10 text-secondary` pills
- **Allergies** — `bg-error-container text-error` pills (matches [patient_medical_record_web.html](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/Webpages%20Screens%20code/patient_medical_record_web.html) mockup)
- **Medications** — `bg-primary/10 text-primary` pills

Each pill has an `×` delete button. Each section has an `+ Add` button → inline text input + submit.

**C. Quick Stats (bottom):** Card with counts (diseases, allergies, medications).

---

### Component 3: AI Medical Report

---

#### [NEW] reports layout.tsx

```
src/app/[locale]/(app)/dashboard/reports/layout.tsx
```

---

#### [NEW] reports page.tsx (~280 lines)

```
src/app/[locale]/(app)/dashboard/reports/page.tsx
```

Flow:
1. **Initial state:** "Generate Report" CTA button
2. **Loading state:** Animated spinner with "AI is generating your report…" text
3. **Result state:** Rendered markdown report in a styled card (the Python RAG returns markdown text)
4. **PDF button:** Calls `downloadReportPdf()` → triggers browser download

Role-aware: passes `user_role=patient` since this is the patient portal. The Python service returns Arabic text for patients and English for doctors.

Design: Inspired by [medical_report_viewer_web.html](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/Webpages%20Screens%20code/medical_report_viewer_web.html).

---

### Component 4: Forbidden Medicines (NAM Report)

---

#### [NEW] forbidden-medicines page.tsx (~250 lines)

```
src/app/[locale]/(app)/dashboard/forbidden-medicines/page.tsx
```

**Hybrid approach:**
1. On mount, calls `GET http://localhost:8000/patient/{patientId}/warnings`
2. If successful, renders API warnings with severity-based cards:
   - `high` → Red card (Forbidden) with `error` color tokens
   - `medium` → Amber/secondary card (Warning)
   - `low` → Blue/outline card (Interaction)
3. If API fails (offline/network error), shows **local reference data** from a hardcoded JSON dataset of common Egyptian medicine interactions (embedded in the component).

Each warning card shows: `type` badge, `severity` level, `message` text.

---

#### [NEW] forbidden-medicines layout.tsx

```
src/app/[locale]/(app)/dashboard/forbidden-medicines/layout.tsx
```

---

### Component 5: Children's Health Suite (9 offline tools)

All tools are **fully offline** — no API calls. Data persists in `localStorage` keyed by tool name.

---

#### [NEW] children hub layout.tsx

```
src/app/[locale]/(app)/dashboard/children/layout.tsx
```

---

#### [NEW] children hub page.tsx

```
src/app/[locale]/(app)/dashboard/children/page.tsx
```

Landing page with a bento grid of 9 tool cards (inspired by [children_s_health_portal_web.html](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/Webpages%20Screens%20code/children_s_health_portal_web.html)). Each card links to `/dashboard/children/{tool-slug}`.

| # | Tool | Slug | Description |
|---|------|------|-------------|
| 1 | Growth Tracker | `growth-tracker` | Height/weight log with simple chart |
| 2 | BMI Calculator | `bmi-calculator` | Weight ÷ height² with category display |
| 3 | Symptom Checker | `symptom-checker` | Checklist → triage guidance (Urgent/Watch/Home) |
| 4 | Developmental Milestones | `milestones` | Age-based milestone checklist |
| 5 | Dosage Calculator | `dosage-calculator` | Weight-based Paracetamol/Ibuprofen (inspired by [pediatric_dosage_calculator_web.html](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/Webpages%20Screens%20code/pediatric_dosage_calculator_web.html)) |
| 6 | Vaccination Tracker | `vaccination-tracker` | Vaccine schedule with completed/upcoming/future |
| 7 | Food Guide | `food-guide` | Age-appropriate foods: safe / avoid / introduce |
| 8 | First Aid Hub | `first-aid` | Illustrated step-by-step guides for 10 common scenarios |
| 9 | (Hub itself) | `/children` | Landing page with all 9 cards |

---

#### [NEW] children [tool] page.tsx (~600 lines)

```
src/app/[locale]/(app)/dashboard/children/[tool]/page.tsx
```

Single dynamic route renders the selected tool. Each tool is a self-contained component with:
- Local state managed by `useState`
- `localStorage` persistence via `useEffect` load/save
- No API calls

The 8 tool-specific renders are selected via a `switch(slug)` pattern, similar to the AI tools `[tool]/page.tsx` pattern.

---

### Component 6: Navigation & i18n Updates

---

#### [MODIFY] [SideNavBar.tsx](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/components/layout/SideNavBar.tsx)

Add 3 new Patient nav items between existing entries:

```diff
 { key: 'profile', icon: 'person', href: '/dashboard/profile', roles: ['Patient'] },
+{ key: 'reports', icon: 'description', href: '/dashboard/reports', roles: ['Patient'] },  // already exists
+{ key: 'forbiddenMeds', icon: 'medication', href: '/dashboard/forbidden-medicines', roles: ['Patient'] },
+{ key: 'childrenHealth', icon: 'child_care', href: '/dashboard/children', roles: ['Patient'] },
```

Wait — `reports` is already in the nav. I need to add only `forbiddenMeds` and `childrenHealth`:

```diff
 { key: 'profile', icon: 'person', href: '/dashboard/profile', roles: ['Patient'] },
+{ key: 'forbiddenMeds', icon: 'medication', href: '/dashboard/forbidden-medicines', roles: ['Patient'] },
+{ key: 'childrenHealth', icon: 'child_care', href: '/dashboard/children', roles: ['Patient'] },
```

---

#### [MODIFY] en.json & ar.json

Add nav keys: `forbiddenMeds`, `childrenHealth`

Add new i18n sections:
- `profile.*` — ~20 keys (edit profile, medical history labels, add/delete)
- `reports.*` — ~10 keys (generate, downloading, disclaimer)
- `forbiddenMeds.*` — ~10 keys (severity labels, offline notice)
- `children.*` — ~40 keys (all 9 tool names, labels, guidance text)

---

## Complete File List (~30 files)

| # | Action | File |
|---|--------|------|
| 1 | MODIFY | `src/types/api.ts` |
| 2 | MODIFY | `src/services/patientService.ts` |
| 3 | NEW | `src/services/reportService.ts` |
| 4 | NEW | `src/app/[locale]/(app)/dashboard/profile/layout.tsx` |
| 5 | NEW | `src/app/[locale]/(app)/dashboard/profile/page.tsx` |
| 6 | NEW | `src/app/[locale]/(app)/dashboard/reports/layout.tsx` |
| 7 | NEW | `src/app/[locale]/(app)/dashboard/reports/page.tsx` |
| 8 | NEW | `src/app/[locale]/(app)/dashboard/forbidden-medicines/layout.tsx` |
| 9 | NEW | `src/app/[locale]/(app)/dashboard/forbidden-medicines/page.tsx` |
| 10 | NEW | `src/app/[locale]/(app)/dashboard/children/layout.tsx` |
| 11 | NEW | `src/app/[locale]/(app)/dashboard/children/page.tsx` |
| 12 | NEW | `src/app/[locale]/(app)/dashboard/children/[tool]/page.tsx` |
| 13 | MODIFY | `src/components/layout/SideNavBar.tsx` |
| 14 | MODIFY | `messages/en.json` |
| 15 | MODIFY | `messages/ar.json` |

---

## Verification Plan

### Automated Tests

```bash
npm run lint   # Exit 0, 0 errors, 0 warnings
npm run build  # Exit 0, all routes compile
```

Expected new routes in build output:
```
├ ƒ /[locale]/dashboard/profile
├ ƒ /[locale]/dashboard/reports
├ ƒ /[locale]/dashboard/forbidden-medicines
├ ƒ /[locale]/dashboard/children
├ ƒ /[locale]/dashboard/children/[tool]
```

### Manual Verification
- Navigate to `/ar/dashboard/profile` — verify profile card renders with skeleton loading
- Navigate to `/ar/dashboard/reports` — verify "Generate Report" button is visible
- Navigate to `/ar/dashboard/forbidden-medicines` — verify offline fallback data renders when Python service is unreachable
- Navigate to `/ar/dashboard/children` — verify all 9 tool cards render
- Navigate to `/ar/dashboard/children/bmi-calculator` — verify calculator works with localStorage persistence
