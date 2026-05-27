# Phase 4 — Doctor Portal

## Summary

Phase 4 implements the full Doctor Portal: a live dashboard with real API data, patient list with appointments, appointment completion, AI report drawer, shared AI tools access, and a read-only doctor profile. Introduces ~10 new/modified files.

---

## Verified Endpoint Map (from C# source)

### .NET Backend (port 7196)

| Feature | Method | URL | Params/Body | Auth | Source |
|---------|--------|-----|-------------|------|--------|
| Doctor info + appointments | GET | `/api/doctor/GetInfoAndAppointments` | `?DoctorId={userId}` | Doctor | [DoctorController.cs](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.API/Controllers/DoctorController.cs#L31-L37) |
| Complete appointment | PUT | `/api/appointment/Complete` | `{ appointmentId }` | Doctor | [AppointmentController.cs](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.API/Controllers/AppointmentController.cs#L54-L60) |
| Cancel appointment | PUT | `/api/appointment/Cancel` | `{ appointmentId }` | Patient,Admin | [AppointmentController.cs](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.API/Controllers/AppointmentController.cs#L70-L76) |

### Python RAG (port 8000) — for report drawer

| Feature | Method | URL | Source |
|---------|--------|-----|--------|
| Report text (English) | GET | `/report/{patientId}/doctor-report?user_role=doctor` | [reportService.ts](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/services/reportService.ts) (already exists) |
| Report PDF (English) | GET | `/report/{patientId}/doctor-report/pdf?user_role=doctor` | Same service |

### Key Response Shape — `GetDoctorAppointmentsAndDoctorInfoResponse`

From [GetDoctorAppointmentsAndDoctorInfoResponse.cs](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.Shared/SharedResponse/GetDoctorAppointmentsAndDoctorInfoResponse.cs):

```typescript
interface DoctorDashboardResponse {
  doctorId: string;
  doctorName: string;
  patients: Array<{
    appointmentId: number;
    patientId: string;
    patientName: string;
    reason: string;
    chronicDiseases: string[];
    allergies: string[];
    currentMedicine: string[];
    appointmentDate: string;
    medicalReport: string;   // may be empty/null
  }>;
}
```

> [!IMPORTANT]
> This single endpoint returns **both** the doctor's info AND all their patients/appointments. There is **no separate** "get doctor profile" endpoint — all profile data comes from this response. The response does NOT include fields like `specialization`, `yearsOfExperience`, `workDays`, `startTime`, `endTime`. The doctor profile page will show only `doctorName` and the patient count derived from this data.

> [!WARNING]
> The `Cancel` endpoint is authorized for `Patient, Admin` only — **NOT Doctor**. Doctors can only `Complete` appointments, not cancel them. The UI will reflect this correctly.

---

## Proposed Changes

### Component 1: API Layer — Types & Services

---

#### [MODIFY] [api.ts](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/types/api.ts)

Add doctor-specific interfaces:

```typescript
// Matches GetDoctorAppointmentsAndDoctorInfoResponse.cs
export interface DoctorPatientEntry {
  appointmentId: number;
  patientId: string;
  patientName: string;
  reason: string;
  chronicDiseases: string[];
  allergies: string[];
  currentMedicine: string[];
  appointmentDate: string;
  medicalReport: string;
}

export interface DoctorDashboardResponse {
  doctorId: string;
  doctorName: string;
  patients: DoctorPatientEntry[];
}
```

---

#### [NEW] doctorService.ts

```
src/services/doctorService.ts
```

| Method | Endpoint |
|--------|----------|
| `getDashboard(doctorId)` | `GET /api/doctor/GetInfoAndAppointments?DoctorId={id}` |
| `completeAppointment(appointmentId)` | `PUT /api/appointment/Complete` body: `{ appointmentId }` |

---

### Component 2: Doctor Dashboard Page

---

#### [MODIFY] [doctor/page.tsx](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/app/%5Blocale%5D/%28app%29/doctor/page.tsx)

**Complete rewrite** of the existing placeholder page. New content:

1. **Greeting header** with doctor name from API: "Good morning, Dr. {doctorName}"
2. **Stats row** (3 cards):
   - **Today's Load** — gradient card — count of today's appointments, completed vs remaining
   - **Total Patients** — count of `patients[]` array
   - **Quick Action** — link to AI Tools
3. **Today's Schedule** — left column — list of today's appointments (filtered by today's date from `patients[]`)
4. **Patient Registry** — right column — all patients with "View Report" button triggering the drawer

Pulls data from `doctorService.getDashboard(user.userId)` on mount.

---

### Component 3: Doctor's Patient List & Appointments

---

#### [NEW] doctor/appointments/page.tsx

```
src/app/[locale]/(app)/doctor/appointments/page.tsx
```

Full appointment management page:

1. **All appointments** from `getDashboard()` response `patients[]`
2. **Filter tabs**: All / Today / Completed (based on local status tracking)
3. **Each appointment card** shows:
   - Patient name, reason, appointment date
   - Colored pills for chronic diseases + allergies + medications
   - **"Mark Complete"** button → calls `PUT /api/appointment/Complete` with `{ appointmentId }`
   - **"View Report"** button → opens the report drawer (see Component 4)
4. **Appointment complete** removes the card from the active list with animation

---

### Component 4: Report Drawer (Right-side slide-in panel)

---

#### [NEW] ReportDrawer.tsx

```
src/components/doctor/ReportDrawer.tsx
```

A reusable slide-in drawer component. Spec from the Phase 3 clarification:

- **Trigger**: "View Report" button on any patient card
- **Position**: Fixed right-side panel, slides in from `end-0`
- **Content**:
  1. Loading skeleton while fetching
  2. Report text (English, from `user_role=doctor`) rendered with the same markdown-lite renderer used in the patient reports page
  3. "Download PDF" button calling `reportService.downloadReportPdf(patientId, 'doctor')` → blob download
  4. Error state with retry if Python service unreachable
- **Behavior**:
  - Close button (×) and click-outside to close
  - Only one drawer open at a time — opening a new one closes the previous
  - Backdrop overlay with blur
- Uses existing `reportService.fetchReportText()` and `reportService.downloadReportPdf()` — no new service methods needed

---

### Component 5: Doctor AI Tools Access (Reuse, no duplication)

---

#### [MODIFY] [SideNavBar.tsx](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/components/layout/SideNavBar.tsx)

Change the existing Doctor nav to add an `aiTools` item pointing to the **same** `/dashboard/ai-tools` route used by patients:

```diff
 // Doctor nav
 { key: 'dashboard', icon: 'dashboard', href: '/doctor', roles: ['Doctor'] },
-{ key: 'patients', icon: 'groups', href: '/doctor/patients', roles: ['Doctor'] },
 { key: 'appointments', icon: 'calendar_month', href: '/doctor/appointments', roles: ['Doctor'] },
-{ key: 'reports', icon: 'description', href: '/doctor/reports', roles: ['Doctor'] },
+{ key: 'aiTools', icon: 'psychology', href: '/dashboard/ai-tools', roles: ['Doctor'] },
+{ key: 'profile', icon: 'person', href: '/doctor/profile', roles: ['Doctor'] },
```

**Key design decision**: AI tools live under `/dashboard/ai-tools` for ALL roles. The existing `[tool]/page.tsx` already reads `user.role` from `authStore` on line 326 and passes it to `aiService` — so when a Doctor uses the tools, `UserRole: "Doctor"` is sent automatically. **No code changes needed** in aiService.ts or the tool pages.

---

### Component 6: Doctor Profile (read-only)

---

#### [NEW] doctor/profile/page.tsx

```
src/app/[locale]/(app)/doctor/profile/page.tsx
```

Read-only profile card. Data comes from the same `getDashboard()` endpoint:

- `doctorName` — displayed as the main heading
- Patient count derived from `patients.length`
- Role badge: "Doctor"

Since the API response does NOT include `specialization`, `yearsOfExperience`, `workDays`, `startTime`, `endTime`, those fields are **not displayed**. If these fields are added to the backend in the future, the frontend can be extended.

---

### Component 7: Navigation & i18n Updates

---

#### [MODIFY] [SideNavBar.tsx](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/components/layout/SideNavBar.tsx)

Update doctor nav items as described above.

---

#### [MODIFY] en.json & ar.json

Update `dashboard.doctor.*` keys:
- Remove `comingSoon`
- Add keys for the new doctor dashboard content

---

## Complete File List (~10 files)

| # | Action | File |
|---|--------|------|
| 1 | MODIFY | `src/types/api.ts` — add doctor response types |
| 2 | NEW | `src/services/doctorService.ts` |
| 3 | MODIFY | `src/app/[locale]/(app)/doctor/page.tsx` — full rewrite |
| 4 | NEW | `src/app/[locale]/(app)/doctor/appointments/page.tsx` |
| 5 | NEW | `src/components/doctor/ReportDrawer.tsx` |
| 6 | NEW | `src/app/[locale]/(app)/doctor/profile/page.tsx` |
| 7 | MODIFY | `src/components/layout/SideNavBar.tsx` — doctor nav |
| 8 | MODIFY | `messages/en.json` |
| 9 | MODIFY | `messages/ar.json` |

---

## Open Questions

None — all endpoints verified, all design decisions documented.

---

## Verification Plan

### Automated Tests

```bash
npm run lint   # Exit 0, 0 errors, 0 warnings
npm run build  # Exit 0, all routes compile
```

Expected new routes:
```
ƒ /[locale]/doctor               (rewritten)
ƒ /[locale]/doctor/appointments   (new)
ƒ /[locale]/doctor/profile        (new)
```

### Manual Verification
- Navigate to `/ar/doctor` as a Doctor user — verify greeting shows doctor name, stats show live data
- Navigate to `/ar/doctor/appointments` — verify appointment cards render with "Mark Complete" and "View Report" buttons
- Click "View Report" — verify drawer slides in from right with loading skeleton → English report text
- Click "Mark Complete" — verify appointment card transitions to completed state
- Navigate to `/ar/dashboard/ai-tools` as Doctor — verify `UserRole: "Doctor"` is sent in API calls
- Navigate to `/ar/doctor/profile` — verify read-only profile card
