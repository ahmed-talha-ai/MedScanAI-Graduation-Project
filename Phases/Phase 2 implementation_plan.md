# Phase 2: Patient Portal, AI Hub, Appointments & Notifications

Phase 1 built the auth infrastructure, design system, and shell. Phase 2 wires **real data** into the Patient portal with all 6 AI tools, appointments, and notifications.

---

## User Review Required

> [!IMPORTANT]
> **Endpoint naming correction:** The user's request says `POST /api/ai/diagnose` and `POST /api/ai/lab-analyze`, but the actual backend controller uses **separate action endpoints per model**:
> - `POST /api/ai/GetBrainTumorDiagnose` (multipart `Image` + `UserRole`)
> - `POST /api/ai/GetXRayDiagnose` (multipart `Image` + `UserRole`)
> - `POST /api/ai/GetBreastCancerDiagnose` (multipart `Image` + `UserRole`)
> - `POST /api/ai/GetDermatologyDiagnose` (multipart `Image` + `UserRole`)
> - `POST /api/ai/GetLabResults` (multipart `Image` + `UserRole`)
> - `POST /api/ai/GetChatbotResponse` (JSON `{ message, userRole }`)
>
> The plan uses the **real** endpoints from `AIController.cs`. No `patientId` field exists in the AI queries — only `Image` (IFormFile) and `UserRole` (string).

> [!IMPORTANT]
> **Chatbot session:** The backend `ChatbotQuery` has `{ Message, UserRole }` only — no `sessionId` or `patientId` field. The chatbot does **not** have a server-side history endpoint. I will implement **client-side chat history** per session, stored in React state, and the `sessionId` will be derived from `userId` for local tracking only.

> [!IMPORTANT]
> **Appointment cancel:** Backend uses `PUT /api/appointment/Cancel` with body `{ appointmentId: int }`, not `PUT /api/appointment/CancelAppointment/{id}` as URL param.

> [!IMPORTANT]
> **Patient profile:** `POST /api/patient/GetProfile` takes `[FromBody]` — not a query string. The payload is `{ patientId: string }`.

> [!WARNING]
> **Appointment booking command:** `BookAppointmentCommand` requires `{ patientId, patientName, doctorId, date, reason, status }`. The `status` field must be sent as `"Pending"`.

---

## Open Questions

> [!IMPORTANT]
> **Q1: Doctor name in appointments response?** `GetPatientAppointmentsResponse` returns `{ appointmentId, patientName, date, status, reason }` but does **not** include `doctorName` or `doctorId`. Should I show the reason as the primary label, or do you have a separate endpoint that returns doctor info per appointment?

> [!IMPORTANT]
> **Q2: Notifications endpoint — no userId param?** `NotificationController.GetUserNotifications()` takes no parameters (it returns hardcoded data). Should I call it as `GET /api/notifications/GetUserNotifications` with no query string?

---

## Proposed Changes

### 1. Types & Shared Infrastructure

#### [MODIFY] [api.ts](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/types/api.ts)

Add all Phase 2 response/payload types to match the verified C# models:

```typescript
// ── Patient Profile ──
export interface PatientProfileResponse {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  gender: string;
  dateOfBirth: string;           // DateOnly → ISO string
  chronicDiseases: PatientHistoryItem[];
  allergies: PatientHistoryItem[];
  currentMedication: PatientHistoryItem[];
}
export interface PatientHistoryItem {
  patientId: string;
  id: number;
  name: string;
}

// ── Appointments ──
export interface AppointmentResponse {
  appointmentId: number;
  patientName: string | null;
  date: string;                  // ISO DateTime
  status: string;                // "Pending" | "Confirmed" | "Completed" | "Cancelled"
  reason: string;
}
export interface BookAppointmentPayload {
  patientId: string;
  patientName: string;
  doctorId: string;
  date: string;                  // ISO DateTime
  reason: string;
  status: string;                // always "Pending"
}
export interface DoctorForAppointment {
  id: string;
  fullName: string;
  specialization: string;
  yearsOfExperience: number;
  availableStartTimes: string[];
}

// ── AI Models ──
export interface ModelDiagnosisResponse {
  classLabelEn: string;
  classLabelAr: string;
  confidenceLevel: string;
  generatedAdvice: string;
}
export interface LabAnalysisResponse {
  status: string;
  analysis: string;
  imagePath: string;
  timeStamp: string;
  cached: boolean;
}
export interface ChatbotApiResponse {
  status: string;
  sessionId: string;
  response: string;
  timeStamp: string;
  cached: boolean;
}

// ── Notifications ──
export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  date: string;
  isRead: boolean;
  type: 'Appointment' | 'Report' | 'System';
}
```

---

### 2. Service Layer

#### [NEW] [patientService.ts](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/services/patientService.ts)

```
getProfile(patientId)       → POST /api/patient/GetProfile  body: { patientId }
```

#### [NEW] [appointmentService.ts](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/services/appointmentService.ts)

```
getPatientAppointments(patientId) → GET  /api/appointment/GetPatientAppointments?PatientId={patientId}
getDoctors()                       → GET  /api/appointment/GetDoctors
bookAppointment(payload)           → POST /api/appointment/BookAppointment
cancelAppointment(appointmentId)   → PUT  /api/appointment/Cancel  body: { appointmentId }
```

#### [NEW] [aiService.ts](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/services/aiService.ts)

All image diagnosis calls use `multipart/form-data` with fields `Image` (File) and `UserRole` (string):

```
diagnoseBrainTumor(file, userRole)    → POST /api/ai/GetBrainTumorDiagnose
diagnoseXRay(file, userRole)          → POST /api/ai/GetXRayDiagnose
diagnoseBreastCancer(file, userRole)  → POST /api/ai/GetBreastCancerDiagnose
diagnoseDermatology(file, userRole)   → POST /api/ai/GetDermatologyDiagnose
analyzeLabResults(file, userRole)     → POST /api/ai/GetLabResults
chatbotMessage(message, userRole)     → POST /api/ai/GetChatbotResponse  body: { message, userRole }
```

#### [NEW] [notificationService.ts](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/services/notificationService.ts)

```
getUserNotifications() → GET /api/notifications/GetUserNotifications
```

---

### 3. Shared UI Components

#### [NEW] [src/components/ui/Skeleton.tsx](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/components/ui/Skeleton.tsx)

Reusable shimmer skeleton for loading states (card skeleton, list row skeleton, text skeleton).

#### [NEW] [src/components/ui/EmptyState.tsx](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/components/ui/EmptyState.tsx)

Reusable empty state with icon + title + subtitle + optional CTA button.

#### [NEW] [src/components/ui/ErrorState.tsx](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/components/ui/ErrorState.tsx)

Reusable error card with retry button.

#### [NEW] [src/components/ui/FileUploadZone.tsx](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/components/ui/FileUploadZone.tsx)

Drag-and-drop file upload zone matching the mockup design (dashed border, cloud_upload icon, gradient CTA). Used by all 5 image-based AI tools.

---

### 4. Patient Dashboard (Real Data)

Replaces the current placeholder page at `app/[locale]/(app)/dashboard/page.tsx`.

#### [MODIFY] [dashboard/page.tsx](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/app/%5Blocale%5D/%28app%29/dashboard/page.tsx)

Design from `patient_web_portal_dashboard.html`:
- **Welcome hero:** "Good morning, {fullName}" with health sanctuary tagline
- **Stats row (3 cards):** Upcoming appointments count, AI analyses run (local counter), active medications count
- **Upcoming appointments list:** From `getPatientAppointments` — show next 3, with status badges (Pending=teal, Confirmed=primary, Completed=surface, Cancelled=tertiary)
- **Quick actions grid:** AI Diagnostic Hub, Book Appointment, Medical Chatbot, Lab Analysis — each links to sub-route

**UX States:**
- Loading → Skeleton cards (3 stat cards + 3 appointment rows)
- Data → Full render
- Empty → "No upcoming appointments" EmptyState with "Book Now" CTA
- Error → ErrorState with retry

---

### 5. AI Diagnostic Hub

#### [NEW] [dashboard/ai-tools/page.tsx](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/app/%5Blocale%5D/%28app%29/dashboard/ai-tools/page.tsx)

Design from `ai_diagnostic_hub_web.html` — **bento grid of 6 model cards:**

| Card | Icon | Accent | Accuracy | Endpoint |
|------|------|--------|----------|----------|
| Brain Tumor (Neurological Oncology) | `neurology` | primary | 99.4% | `GetBrainTumorDiagnose` |
| Chest X-Ray (Pulmonary Radiography) | `pulmonology` | secondary | 98.1% | `GetXRayDiagnose` |
| Skin Lesion (Dermatological Screening) | `dermatology` | primary | 97.8% | `GetDermatologyDiagnose` |
| Breast Cancer | `mammography` | secondary | 97.2% | `GetBreastCancerDiagnose` |
| Lab OCR (Clinical Lab Analysis) | `clinical_notes` | primary | — | `GetLabResults` |
| Medical Chatbot (AI Health Guide) | `smart_toy` | secondary | — | `GetChatbotResponse` |

Each card links to `/dashboard/ai-tools/{slug}`.

#### [NEW] [dashboard/ai-tools/[tool]/page.tsx](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/app/%5Blocale%5D/%28app%29/dashboard/ai-tools/%5Btool%5D/page.tsx)

**For image diagnosis tools (brain-tumor, xray, breast-cancer, skin):**
- Design from `chest_x_ray_analysis_wizard_web.html`
- 3-step wizard: **Upload → Processing → Results**
- Step 1: `FileUploadZone` (drag-and-drop, max 50MB, JPEG/PNG/DICOM)
- Step 2: Animated progress ring with "AI is analyzing…"
- Step 3: Results card showing `classLabelEn`/`classLabelAr`, confidence gauge, `generatedAdvice`, "Generate Report" button

**For Lab OCR (`lab-ocr`):**
- Design from `clinical_lab_trends_ocr_analysis_web.html`
- Upload zone → Results showing `analysis` text with AI extraction notes card + original uploaded image preview

**For Chatbot (`chatbot`):**
- Design from `ai_health_guide_chatbot_web.html`
- Full-height split layout: **60% chat panel + 40% assessment panel**
- Chat panel: message history (local state), typing indicator, input with send button
- Messages stored in React state as `{ role: 'user'|'ai', content: string, timestamp: Date }[]`
- `sessionId` derived as `chat_${userId}` — stored locally, never shared between users
- Assessment panel: shows latest AI response metadata
- Medical disclaimer at bottom

---

### 6. Appointments

#### [NEW] [dashboard/appointments/page.tsx](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/app/%5Blocale%5D/%28app%29/dashboard/appointments/page.tsx)

Design inspired by `appointments_telehealth_web.html` but adapted for **patient view** (not doctor/admin):

- **Header:** "My Appointments" + "Book New" CTA button
- **Tabs:** All | Upcoming | Completed | Cancelled (client-side filter)
- **Appointment cards:** List view with status badge, date, reason, cancel button (only for Pending/Confirmed)
- **Book appointment modal/wizard:**
  1. Select specialization → Filter doctors from `GetDoctors`
  2. Select doctor → Show available times
  3. Select date/time + enter reason → Submit `BookAppointment`
  4. Confirmation screen with appointment details

**UX States per section:**
- Loading → 4 skeleton cards
- Data → Appointment list with status badges
- Empty → EmptyState "No appointments yet" + Book Now
- Error → ErrorState with retry

---

### 7. Notifications

#### [NEW] [src/components/layout/NotificationPanel.tsx](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/components/layout/NotificationPanel.tsx)

Dropdown panel triggered from the notification bell in `TopNavBar.tsx`:
- Fetches on click from `GetUserNotifications`
- Groups by read/unread
- Each item shows icon (by type), title, body preview, relative time
- Badge count on bell icon shows unread count

#### [MODIFY] [TopNavBar.tsx](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/components/layout/TopNavBar.tsx)

Wire notification bell to open `NotificationPanel` and show unread badge.

---

### 8. i18n Messages

#### [MODIFY] [messages/ar.json](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/messages/ar.json) & [messages/en.json](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/messages/en.json)

Add keys for:
- `dashboard.patient.*` — welcome, stats, quick actions
- `aiTools.*` — hub title, model names, upload prompts, result labels
- `appointments.*` — list headers, booking wizard steps, status labels
- `notifications.*` — panel title, empty text, type labels
- `common.*` — loading, error, retry, empty state labels

---

### 9. Routing & Navigation Updates

#### [MODIFY] [SideNavBar.tsx](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/components/layout/SideNavBar.tsx)

Update patient nav items to include the new sub-routes. The `NAV_ITEMS` array already has placeholders — verify `href` paths match.

#### [NEW] [dashboard/ai-tools/layout.tsx](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/app/%5Blocale%5D/%28app%29/dashboard/ai-tools/layout.tsx)

Pass-through layout (just renders `children`) to support the nested route group.

#### [NEW] [dashboard/appointments/layout.tsx](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/app/%5Blocale%5D/%28app%29/dashboard/appointments/layout.tsx)

Pass-through layout for nested appointment routes.

---

## File Summary

| Action | Path | Purpose |
|--------|------|---------|
| MODIFY | `src/types/api.ts` | Add 12 new TypeScript interfaces |
| NEW | `src/services/patientService.ts` | Patient profile API |
| NEW | `src/services/appointmentService.ts` | CRUD appointment APIs |
| NEW | `src/services/aiService.ts` | 6 AI model APIs (multipart + JSON) |
| NEW | `src/services/notificationService.ts` | Notification API |
| NEW | `src/components/ui/Skeleton.tsx` | Loading skeleton |
| NEW | `src/components/ui/EmptyState.tsx` | Empty state component |
| NEW | `src/components/ui/ErrorState.tsx` | Error state + retry |
| NEW | `src/components/ui/FileUploadZone.tsx` | Drag-and-drop upload |
| MODIFY | `dashboard/page.tsx` | Real patient dashboard |
| NEW | `dashboard/ai-tools/page.tsx` | AI hub bento grid |
| NEW | `dashboard/ai-tools/layout.tsx` | Pass-through layout |
| NEW | `dashboard/ai-tools/[tool]/page.tsx` | Per-tool wizard/chat page |
| NEW | `dashboard/appointments/page.tsx` | Appointment list + booking |
| NEW | `dashboard/appointments/layout.tsx` | Pass-through layout |
| NEW | `components/layout/NotificationPanel.tsx` | Notification dropdown |
| MODIFY | `components/layout/TopNavBar.tsx` | Wire notification bell |
| MODIFY | `components/layout/SideNavBar.tsx` | Verify nav paths |
| MODIFY | `messages/ar.json` | Add ~80 new i18n keys |
| MODIFY | `messages/en.json` | Add ~80 new i18n keys |

**Total: 11 new files, 6 modified files**

---

## Verification Plan

### Automated Tests
```bash
npm run build   # Must exit 0 with all 30+ routes compiling
npm run lint    # Must exit 0, 0 errors, 0 warnings
```

### Manual Verification
- Check each new route renders without runtime errors in dev mode (`npm run dev`)
- Verify all API service files correctly construct requests (multipart for AI, JSON for chat/appointments)
- Confirm loading skeleton → error state → empty state transitions work by testing with backend offline
- Verify RTL layout renders correctly for Arabic locale
