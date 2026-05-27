# Phase 5 — Admin Portal

## Summary

Phase 5 implements the full Admin Portal: a live dashboard with real patient/doctor counts and today's appointments, doctor management (list + add), admin registration, walk-in appointment booking, and updated navigation. ~14 new/modified files.

---

## Verified Endpoint Map (from C# source)

### .NET Backend (port 7196)

| Feature | Method | URL | Params/Body | Auth | Source |
|---------|--------|-----|-------------|------|--------|
| Patient count | GET | `/api/patient/GetPatientsCount` | _none_ | _none_ | [PatientController.cs:L41-L47](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.API/Controllers/PatientController.cs#L41-L47) |
| Doctor count | GET | `/api/doctor/GetCount` | _none_ | Admin | [DoctorController.cs:L64-L70](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.API/Controllers/DoctorController.cs#L64-L70) |
| All doctors | GET | `/api/doctor/GetAll` | _none_ | Admin | [DoctorController.cs:L40-L46](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.API/Controllers/DoctorController.cs#L40-L46) |
| Active doctors | GET | `/api/doctor/GetActive` | _none_ | Admin | [DoctorController.cs:L48-L54](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.API/Controllers/DoctorController.cs#L48-L54) |
| Active doctor count | GET | `/api/doctor/GetActiveCount` | _none_ | Admin | [DoctorController.cs:L56-L62](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.API/Controllers/DoctorController.cs#L56-L62) |
| Today's appts | GET | `/api/appointment/GetForToday` | _none_ | Admin | [AppointmentController.cs:L38-L44](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.API/Controllers/AppointmentController.cs#L38-L44) |
| Confirm appt | POST | `/api/appointment/Confirm` | `{ appointmentId }` | Admin | [AppointmentController.cs:L46-L52](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.API/Controllers/AppointmentController.cs#L46-L52) |
| Cancel appt | PUT | `/api/appointment/Cancel` | `{ appointmentId }` | Patient,Admin | [AppointmentController.cs:L70-L76](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.API/Controllers/AppointmentController.cs#L70-L76) |
| Register doctor | POST | `/api/authentication/RegisterDoctor` | see below | Admin | [AuthenticationController.cs:L16-L22](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.API/Controllers/AuthenticationController.cs#L16-L22) |
| Register admin | POST | `/api/authentication/RegisterAdmin` | see below | Admin | [AuthenticationController.cs:L31-L37](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.API/Controllers/AuthenticationController.cs#L31-L37) |
| Book by admin | POST | `/api/appointment/BookAppointmentByAdmin` | see below | Admin | [AppointmentController.cs:L22-L28](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.API/Controllers/AppointmentController.cs#L22-L28) |
| Doctors for appt | GET | `/api/appointment/GetDoctors` | `?PatientId=` | Patient,Admin | [AppointmentController.cs:L30-L36](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.API/Controllers/AppointmentController.cs#L30-L36) |
| Delete doctor | POST | `/api/doctor/DeleteDoctor` | `{ doctorId }` | Admin,Doctor | [DoctorController.cs:L15-L21](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.API/Controllers/DoctorController.cs#L15-L21) |
| Restore doctor | POST | `/api/doctor/RestoreDoctor` | `{ doctorId }` | Admin,Doctor | [DoctorController.cs:L23-L29](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.API/Controllers/DoctorController.cs#L23-L29) |

---

### Key Command Models (from C# source)

#### RegisterDoctorCommand
```typescript
{
  fullName: string;
  password: string;
  email: string;
  phoneNumber: string;
  yearsOfExperience: number;    // int
  specializationId: number;     // int — FK to Specializations table
  workDays: string[];           // List<string> — e.g. ["saturday","sunday"]
  startTime: string;            // TimeSpan — sent as "HH:mm:ss"
  endTime: string;              // TimeSpan — sent as "HH:mm:ss"
}
```

#### RegisterAdminCommand
```typescript
{
  userName: string;
  email: string;
  password: string;
}
```

#### BookAppointmentByAdminCommand
```typescript
{
  patientId?: string;    // nullable — can be null for walk-in with name only
  patientName?: string;  // nullable — used when no registered patient
  doctorId: string;
  date: string;          // DateTime — ISO format
  reason: string;
  status: string;        // always "Pending"
}
```

---

### Key Response Shapes

#### GetPatientsCountResponse
```typescript
{ count: number }
```

#### GetAllDoctorsCountQuery → `ReturnBase<int>`
Returns `ReturnBase<int>` — the count is directly in `data`.

#### GetAllDoctorsResponse (from doctor/GetAll)
```typescript
{
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
}
```

#### GetDoctorsForAppointmentsResponse (from appointment/GetDoctors)
```typescript
{
  id: string;
  fullName: string;
  specialization: string;        // name, not ID
  yearsOfExperience: number;
  availableStartTimes: string[];  // available time slots
}
```

#### GetTodayAppointmentsResponse (from appointment/GetForToday)
```typescript
{
  id: number;
  patientName: string;
  doctorName: string;
  time: string;
  status: string;
}
```

---

### Specializations (seeded in DB migration — no API endpoint)

> [!IMPORTANT]
> **No SpecializationController exists.** The specializations are seeded via EF migration data. There is no endpoint to fetch them dynamically. We will hardcode the 3 seeded specializations as a static list in the frontend. If new specializations are added to the DB, the frontend list must be updated manually.

| ID | Name (Arabic) | English Label |
|----|---------------|---------------|
| 1 | الأمراض الجلدية | Dermatology |
| 2 | طب الأعصاب | Neurology |
| 3 | أمراض الصدر | Pulmonology |

---

### Patient List for Walk-in Booking

> [!IMPORTANT]
> **No `GetAllPatients` endpoint exists** in `PatientController.cs`. The controller only has `CreateProfile`, `GetProfile`, `UpdateProfile`, and `GetPatientsCount`. For the walk-in booking form, we have two options:
> 1. Use `patientName` only (nullable `patientId`) — the `BookAppointmentByAdminCommand` already supports this with `PatientId?` nullable
> 2. Use `GetDoctors` endpoint (`GET /api/appointment/GetDoctors`) which takes a `PatientId` query param — but this returns doctors, not patients
>
> **Decision**: The booking form will have a **manual text input** for patient name (no dropdown). `PatientId` will be left null. This matches the C# model where both `PatientId` and `PatientName` are nullable strings.

---

## Proposed Changes

### Component 1: API Layer — Types & Services

---

#### [MODIFY] [api.ts](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/types/api.ts)

Add admin-specific interfaces:

```typescript
// ─── Phase 5: Admin Portal ────────────────────────────────────────────────────

// GET /api/patient/GetPatientsCount
export interface PatientsCountResponse {
  count: number;
}

// GET /api/doctor/GetAll
export interface DoctorListEntry {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
}

// GET /api/appointment/GetForToday
export interface TodayAppointmentEntry {
  id: number;
  patientName: string;
  doctorName: string;
  time: string;
  status: string;
}

// GET /api/appointment/GetDoctors  (reusable for booking form doctor picker)
export interface DoctorForAppointment {
  id: string;
  fullName: string;
  specialization: string;
  yearsOfExperience: number;
  availableStartTimes: string[];
}

// POST /api/authentication/RegisterDoctor
export interface RegisterDoctorPayload {
  fullName: string;
  password: string;
  email: string;
  phoneNumber: string;
  yearsOfExperience: number;
  specializationId: number;
  workDays: string[];
  startTime: string;  // "HH:mm:ss"
  endTime: string;    // "HH:mm:ss"
}

// POST /api/authentication/RegisterAdmin
export interface RegisterAdminPayload {
  userName: string;
  email: string;
  password: string;
}

// POST /api/appointment/BookAppointmentByAdmin
export interface BookAppointmentByAdminPayload {
  patientId?: string;
  patientName?: string;
  doctorId: string;
  date: string;       // ISO datetime
  reason: string;
  status: string;     // always "Pending"
}
```

---

#### [NEW] adminService.ts

```
src/services/adminService.ts
```

| Method | Endpoint | Returns |
|--------|----------|---------|
| `getPatientsCount()` | `GET /api/patient/GetPatientsCount` | `ReturnBase<PatientsCountResponse>` |
| `getDoctorsCount()` | `GET /api/doctor/GetCount` | `ReturnBase<number>` |
| `getAllDoctors()` | `GET /api/doctor/GetAll` | `ReturnBase<IQueryable<DoctorListEntry>>` — returns array in `data` |
| `getTodayAppointments()` | `GET /api/appointment/GetForToday` | `ReturnBase<TodayAppointmentEntry[]>` |
| `getDoctorsForAppointment()` | `GET /api/appointment/GetDoctors` | `ReturnBase<DoctorForAppointment[]>` |
| `registerDoctor(payload)` | `POST /api/authentication/RegisterDoctor` | `ReturnBase<boolean>` |
| `registerAdmin(payload)` | `POST /api/authentication/RegisterAdmin` | `ReturnBase<boolean>` |
| `bookAppointmentByAdmin(payload)` | `POST /api/appointment/BookAppointmentByAdmin` | `ReturnBase<boolean>` |
| `confirmAppointment(appointmentId)` | `POST /api/appointment/Confirm` | `ReturnBase<boolean>` |
| `cancelAppointment(appointmentId)` | `PUT /api/appointment/Cancel` | `ReturnBase<boolean>` |
| `deleteDoctor(doctorId)` | `POST /api/doctor/DeleteDoctor` | `ReturnBase<boolean>` |
| `restoreDoctor(doctorId)` | `POST /api/doctor/RestoreDoctor` | `ReturnBase<boolean>` |

---

### Component 2: Admin Dashboard (rewrite placeholder)

---

#### [MODIFY] [admin/page.tsx](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/app/%5Blocale%5D/%28app%29/admin/page.tsx)

**Complete rewrite** of the placeholder page. New content:

1. **Greeting header** — "Welcome, Admin" with today's date
2. **Stats row** (4 cards) — **live data** from API:
   - Total Doctors → `getDoctorsCount()`
   - Total Patients → `getPatientsCount()`
   - Today's Appointments → `getTodayAppointments().length`
   - System Uptime → static "99.9%"
3. **Quick Actions grid** (4 cards, all clickable now):
   - Add Doctor → link to `/admin/add-doctor`
   - Add Admin → link to `/admin/add-admin`
   - Walk-in Booking → link to `/admin/book-appointment`
   - Doctor Management → link to `/admin/doctors`
4. **Today's Appointments table** — live data from `getTodayAppointments()`
   - Columns: Patient, Doctor, Time, Status, Actions (Confirm / Cancel)

---

### Component 3: Doctor Management

---

#### [MODIFY] (current route exists in SideNavBar but no page file) admin/doctors/page.tsx

```
src/app/[locale]/(app)/admin/doctors/page.tsx
```

Full doctor management page:

1. **Header** with "Add Doctor" button → link to `/admin/add-doctor`
2. **Doctor cards grid** from `getAllDoctors()`
3. Each card shows:
   - Avatar with initials
   - Full name, email, phone
   - Active/Inactive status badge
   - **Deactivate** button (calls `deleteDoctor`) or **Restore** button (calls `restoreDoctor`) based on `isActive`
4. **Filter tabs**: All / Active / Inactive

---

### Component 4: Add Doctor Form

---

#### [NEW] admin/add-doctor/page.tsx

```
src/app/[locale]/(app)/admin/add-doctor/page.tsx
```

Full registration form matching `RegisterDoctorCommand` exactly:

| Field | Type | Validation |
|-------|------|------------|
| fullName | text | required, min 3 chars |
| email | email | required, valid email |
| password | password | required, min 8 chars, 1 symbol, 1 number (existing Zod rules) |
| phoneNumber | tel | required |
| yearsOfExperience | number | required, min 0 |
| specializationId | select | required — dropdown with 3 hardcoded options (ID 1–3) |
| workDays | multi-select checkboxes | required, at least 1 day — values: saturday, sunday, monday, tuesday, wednesday, thursday, friday |
| startTime | time picker (input type="time") | required |
| endTime | time picker (input type="time") | required, must be after startTime |

- On submit: POST to `registerDoctor()`, show success toast and redirect to `/admin/doctors`
- Display backend validation errors from `res.message`

---

### Component 5: Add Admin Form

---

#### [NEW] admin/add-admin/page.tsx

```
src/app/[locale]/(app)/admin/add-admin/page.tsx
```

Simple form matching `RegisterAdminCommand`:

| Field | Type | Validation |
|-------|------|------------|
| userName | text | required, min 3 chars |
| email | email | required |
| password | password | required, min 8 chars, 1 symbol, 1 number |

- On submit: POST to `registerAdmin()`, show success toast

---

### Component 6: Walk-in Appointment Booking

---

#### [NEW] admin/book-appointment/page.tsx

```
src/app/[locale]/(app)/admin/book-appointment/page.tsx
```

Booking form matching `BookAppointmentByAdminCommand`:

| Field | Type | Source |
|-------|------|--------|
| patientName | text input | manual entry |
| doctorId | select dropdown | populated from `getDoctorsForAppointment()` — shows `fullName (specialization)` |
| date | datetime-local picker | required |
| reason | textarea | required |
| status | hidden | always "Pending" |

- `patientId` is left null (no patient lookup endpoint)
- On submit: POST to `bookAppointmentByAdmin()`, show success toast

---

### Component 7: Navigation & i18n

---

#### [MODIFY] [SideNavBar.tsx](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/components/layout/SideNavBar.tsx)

Update admin nav items — remove placeholder routes that don't have pages, add the new ones:

```diff
  // Admin nav
  { key: 'admin', icon: 'admin_panel_settings', href: '/admin', roles: ['Admin'] },
  { key: 'doctors', icon: 'medical_services', href: '/admin/doctors', roles: ['Admin'] },
- { key: 'patients', icon: 'groups', href: '/admin/patients', roles: ['Admin'] },
- { key: 'appointments', icon: 'calendar_month', href: '/admin/appointments', roles: ['Admin'] },
- { key: 'settings', icon: 'settings', href: '/admin/settings', roles: ['Admin'] },
+ { key: 'addDoctor', icon: 'person_add', href: '/admin/add-doctor', roles: ['Admin'] },
+ { key: 'addAdmin', icon: 'manage_accounts', href: '/admin/add-admin', roles: ['Admin'] },
+ { key: 'bookAppointment', icon: 'calendar_add_on', href: '/admin/book-appointment', roles: ['Admin'] },
```

---

#### [MODIFY] en.json & ar.json

Update `nav.*` keys for new admin items and update `dashboard.admin.*` keys to replace `comingSoon`.

---

## Complete File List (~14 files)

| # | Action | File |
|---|--------|------|
| 1 | MODIFY | `src/types/api.ts` — add admin response types |
| 2 | NEW | `src/services/adminService.ts` |
| 3 | MODIFY | `src/app/[locale]/(app)/admin/page.tsx` — full rewrite |
| 4 | NEW | `src/app/[locale]/(app)/admin/doctors/page.tsx` |
| 5 | NEW | `src/app/[locale]/(app)/admin/add-doctor/page.tsx` |
| 6 | NEW | `src/app/[locale]/(app)/admin/add-admin/page.tsx` |
| 7 | NEW | `src/app/[locale]/(app)/admin/book-appointment/page.tsx` |
| 8 | MODIFY | `src/components/layout/SideNavBar.tsx` — admin nav |
| 9 | MODIFY | `messages/en.json` |
| 10 | MODIFY | `messages/ar.json` |

---

## Open Questions

> [!IMPORTANT]
> **Q1: `GetAll` returns `IQueryable<GetAllDoctorsResponse>`** — This response does NOT include `specialization`, `yearsOfExperience`, `workDays`, or `startTime/endTime`. It only has `id, fullName, email, phoneNumber, isActive`. The doctor management list will only show these fields. Should I additionally call `GetDoctors` (from `AppointmentController`) to get specialization info for each doctor card? This would be a second API call but gives richer data. Otherwise, the doctor list will show only name, email, phone, and active status.

> [!NOTE]
> **Q2: Today's Appointments table actions** — The admin can `Confirm` (POST) and `Cancel` (PUT) appointments from the dashboard. Should both actions be shown as buttons in the appointments table, or should Confirm only show for "Pending" appointments and Cancel only for "Pending"/"Confirmed"?

---

## Verification Plan

### Automated Tests

```bash
npm run lint   # Exit 0, 0 errors, 0 warnings
npm run build  # Exit 0, all routes compile
```

Expected new routes:
```
ƒ /[locale]/admin               (rewritten)
ƒ /[locale]/admin/doctors        (new)
ƒ /[locale]/admin/add-doctor     (new)
ƒ /[locale]/admin/add-admin      (new)
ƒ /[locale]/admin/book-appointment (new)
```

### Manual Verification
- Navigate to `/ar/admin` as Admin — verify live counts and today's appointments table
- Navigate to `/ar/admin/doctors` — verify doctor list with status badges and Deactivate/Restore buttons
- Navigate to `/ar/admin/add-doctor` — verify form with all 9 fields including specialization dropdown, workDays checkboxes, time pickers
- Submit add doctor form — verify success toast and redirect
- Navigate to `/ar/admin/add-admin` — verify 3-field form
- Navigate to `/ar/admin/book-appointment` — verify doctor dropdown populated, submit sends correct payload with `status: "Pending"` and `patientId: null`
