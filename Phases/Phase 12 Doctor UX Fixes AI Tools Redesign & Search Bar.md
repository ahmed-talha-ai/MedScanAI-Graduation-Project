# Phase 12: Doctor UX Fixes, AI Tools Redesign & Search Bar

Fixes critical bugs in the doctor portal, redesigns the AI tools hub layout, enhances the doctor profile with professional details, and implements a functional search bar.

---

## User Review Required

> [!IMPORTANT]
> The **Doctor Profile Enhancement** (Change 3) adds static/hardcoded fields for specialization, degree, clinic address, phone, consultation fees, etc. The current backend `GetInfoAndAppointments` endpoint only returns `doctorName` and `patients[]`. **These new fields will need to be added to the .NET backend later** or read from the registration data. For now, I will display whatever data the API returns, and show placeholder labels (e.g., "Not specified") for any fields the backend doesn't yet provide. Is that acceptable, or should I skip this change until the backend is updated?

> [!IMPORTANT]
> The **Search Bar** (Change 5) will be a client-side command palette that navigates between pages. It cannot search patient records or backend data since there is no search API. Is a page/feature navigator sufficient?

## Open Questions

1. **Doctor Profile — Data Source**: Should the clinic address, phone, and consultation fees be hardcoded per doctor in the frontend for now, or should I only show what comes from the API?
2. **AI Tools Reorder**: Based on the wireframe, I plan to put **Lab Analysis (OCR)** and **Chatbot** side-by-side as the top two featured tools, followed by the diagnostic models. Does this match your expectation?

---

## Proposed Changes

### Change 1: Fix Report Drawer Auto-Open Bug (Critical)

**Problem**: The `ReportDrawer` is always rendered at the bottom of the doctor appointments page with `patientId={drawerPatientId}`. The initial state is `null`, which correctly means "closed." However, the drawer's CSS transition makes it visible even when closed because its `translate-x-full` transform isn't preventing layout impact, and the backdrop is still rendered (just transparent). On some browsers/RTL layouts, the initial render briefly flashes the drawer.

**Root Cause from screenshot**: The drawer appears open with "No report yet" message. This means `drawerPatientId` is somehow getting a non-null value on mount, OR the drawer transition CSS isn't hiding it properly.

**Fix**: Wrap the `<ReportDrawer>` in a conditional so it only mounts when a patient is actually selected.

#### [MODIFY] [page.tsx](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/app/%5Blocale%5D/%28app%29/doctor/appointments/page.tsx)
- Change line 338–343: Wrap `<ReportDrawer>` in `{drawerPatientId && ( ... )}` so it only renders when a patient is selected
- This eliminates any possibility of the drawer appearing when no patient is selected

---

### Change 2: Fix "AI Tools" Navigation for Doctor Role

**Problem**: The sidebar link for Doctor's "AI Tools" points to `/dashboard/ai-tools` (line 30 in `SideNavBar.tsx`). Similarly, the doctor profile page links to `/dashboard/ai-tools` (line 139 in `doctor/profile/page.tsx`). The `/dashboard/*` routes are under the Patient role's route group, which may cause routing issues or fail the role guard check.

**Fix**: Since the AI tools page is shared between patients and doctors, the route should work for both. The actual issue is that the `ai-tools` nav item for the Doctor role is pointing to `'/dashboard/ai-tools'` which is the same route used by patients. I will verify the proxy/middleware allows Doctor role access to this path, and ensure the navigation works correctly.

#### [MODIFY] [SideNavBar.tsx](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/components/layout/SideNavBar.tsx)
- Verify line 30: `{ key: 'aiTools', icon: 'psychology', href: '/dashboard/ai-tools', roles: ['Doctor'] }` — confirm the proxy allows Doctor role on `/dashboard/ai-tools`

#### [MODIFY] [proxy.ts](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/proxy.ts)
- Verify that `/dashboard/ai-tools` is accessible by `Doctor` role. If not, add `Doctor` to the allowed roles for this route prefix.

---

### Change 3: Enhance Doctor Profile Page

**Problem**: The current doctor profile page is minimal — it only shows the doctor's name, patient count, role, userId, and account status. It lacks professional details expected of a medical professional's profile.

**Enhancement**: Redesign the profile page to include:
- **Professional Section**: Specialization, academic degree, graduation year, years of experience, certificates
- **Contact & Booking Section**: Phone number, consultation types (In-clinic, Phone consultation), fees for each
- **Clinic Address Section**: Full clinic address with a map icon
- **Note**: Fields not yet available from the API will show "—" (not specified) placeholder

#### [MODIFY] [page.tsx](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/app/%5Blocale%5D/%28app%29/doctor/profile/page.tsx)
- Add new professional info card section after the name card:
  - Specialization (from API if available)
  - Academic Degree (placeholder until backend supports it)
  - Years of Experience (from API if available)
  - Certificates (placeholder)
- Add contact & booking card:
  - Phone number (from API registration data if available)
  - Consultation types with fees (placeholder structure)
- Add clinic address card
- Add corresponding i18n translation keys

#### [MODIFY] [ar.json](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/messages/ar.json)
- Add new keys under `doctorDash`: `specialization`, `degree`, `experience`, `certificates`, `clinicAddress`, `phone`, `consultation`, `inClinic`, `phoneConsult`, `fees`, `notSpecified`

#### [MODIFY] [en.json](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/messages/en.json)
- Add matching English keys

---

### Change 4: AI Tools Hub Redesign — Icon Consistency & Layout Reorder

**Problem 1 — Icon Mismatch**: The landing page uses `lucide-react` icons (Brain, Ribbon, Microscope, etc.) for the 7 AI services, but the internal AI tools hub page uses Material Symbols (neurology, radiology, dermatology, etc.). These should be consistent.

**Decision**: Use **Material Symbols** consistently everywhere (they're already loaded globally). Replace the landing page `lucide-react` icons with the same Material Symbols used internally. This keeps things consistent and removes the `lucide-react` dependency for these cards.

**Problem 2 — Layout Order**: The AI tools are currently ordered: Brain Tumor → Chest X-Ray → Skin → Breast Cancer → Lab OCR → Chatbot. Per the user's wireframe, the layout should be:
1. **Top row (featured, 2 large cards)**: Lab Analysis (OCR) | Chatbot
2. **Second row (diagnostic, grouped)**: Brain Tumor + Examination | Chest X-Ray + Skin Disease
3. Examinations stay on their separate page

**Problem 3 — Examinations icons**: The examinations page icons should match the landing page icons for Brain Tumor (neurology), Breast (woman), and Skin (dermatology). Currently they already use Material Symbols, so these are consistent. No change needed here.

#### [MODIFY] [page.tsx (Landing)](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/app/%5Blocale%5D/page.tsx)
- Replace `lucide-react` icon components with Material Symbols `<span>` elements
- Use the same icon names as the AI tools hub: `neurology`, `radiology`, `dermatology`, `health_and_safety`, `clinical_notes`, `smart_toy`, `description`
- Remove unused lucide imports

#### [MODIFY] [page.tsx (AI Tools Hub)](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/app/%5Blocale%5D/%28app%29/dashboard/ai-tools/page.tsx)
- Reorder AI_TOOLS array: Lab OCR → Chatbot → Brain Tumor → Chest X-Ray → Skin → Breast Cancer
- Change the grid layout: first 2 items span full width (featured row with larger cards), remaining 4 in a 2×2 grid
- This matches the user's wireframe: OCR + Chatbot on top, diagnostic tools below

---

### Change 5: Functional Search Bar (Command Palette)

**Problem**: The search bar in the top navigation is purely cosmetic — typing does nothing.

**Enhancement**: Convert the search bar into a functional **command palette / page navigator**:
- When the user types, show a dropdown with matching pages/features
- Pages are defined based on the user's role (Patient, Doctor, Admin)
- Pressing Enter or clicking a result navigates to that page
- Pressing Escape or clicking outside closes the dropdown
- Supports both Arabic and English search terms

#### [MODIFY] [TopNavBar.tsx](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/components/layout/TopNavBar.tsx)
- Add `searchQuery` state and filtered results
- Define a `SEARCHABLE_PAGES` array with: `{ key, icon, href, roles, searchTermsAr, searchTermsEn }`
- Render a dropdown below the search input with filtered matches
- Handle keyboard navigation (arrow keys, Enter, Escape)
- Close on outside click

#### [MODIFY] [ar.json](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/messages/ar.json)
- Add `nav.noResults` key

#### [MODIFY] [en.json](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/messages/en.json)
- Add `nav.noResults` key

---

## Summary of Changes

| # | Change | Files | Severity |
|---|--------|-------|----------|
| 1 | Fix Report Drawer auto-open bug | `doctor/appointments/page.tsx` | 🔴 Critical |
| 2 | Fix AI Tools navigation for Doctor role | `SideNavBar.tsx`, `proxy.ts` | 🟡 Medium |
| 3 | Enhance Doctor Profile page | `doctor/profile/page.tsx`, `ar.json`, `en.json` | 🟢 Enhancement |
| 4 | AI Tools hub redesign + icon consistency | `page.tsx` (landing), `ai-tools/page.tsx` | 🟡 Medium |
| 5 | Functional Search Bar | `TopNavBar.tsx`, `ar.json`, `en.json` | 🟢 Enhancement |

---

## Verification Plan

### Automated Tests
- Run `npx next lint` and `npx tsc --noEmit` to ensure no type or lint errors after all changes

### Manual Verification
1. **Report Drawer**: Open doctor appointments page with no appointments → drawer must NOT appear
2. **Report Drawer**: Click "View Report" on a patient card → drawer opens correctly
3. **AI Tools Nav**: Click "AI Tools" from doctor sidebar → navigates to AI tools page
4. **Doctor Profile**: Visit doctor profile → see professional details, contact, and clinic sections
5. **Landing Page Icons**: Visit landing page → icons match the internal AI tools hub icons
6. **AI Tools Layout**: Visit AI tools hub → Lab OCR and Chatbot are featured at top, diagnostics below
7. **Search Bar**: Type in search bar → see matching pages, click to navigate

---
---

# Additional Sections — New Features

---

## Section A: "أطباؤنا" (Our Doctors) Page

### Overview

A new browsable doctors directory page accessible by **Patients** (read-only) and **Admins** (with edit capabilities). Includes sophisticated rating visibility rules to avoid discouraging users from specializations with few doctors.

### Data Sources (Current Backend)

The backend provides two relevant endpoints:
- `GET /api/doctor/GetAll` → `DoctorListEntry[]` — **Admin only** — returns: `id`, `fullName`, `email`, `phoneNumber`, `isActive`
- `GET /api/appointment/GetDoctors` → `DoctorForAppointment[]` — **Patient, Admin** — returns: `id`, `fullName`, `specialization`, `yearsOfExperience`, `availableStartTimes[]`

> [!WARNING]
> Neither endpoint returns: **photo**, **governorate**, **bio**, **clinic address**, **consultation fees**, **academic degree**, or **ratings/reviews**. These fields do not exist in the current .NET backend. The plan must account for this.

### Storage Strategy — ✅ RESOLVED: Backend Endpoints

All data persists via the .NET backend. No localStorage.

| Field | Source | Fallback |
|-------|--------|----------|
| `fullName`, `specialization`, `yearsOfExperience` | `GET /api/appointment/GetDoctors` | — |
| `email`, `phoneNumber`, `isActive` | `GET /api/doctor/GetAll` (Admin only) | — |
| `photo` (base64), `bio`, `clinicAddress`, `consultationFee`, `governorate` | `GET /api/doctor/GetExtra/{doctorId}` | Default avatar (initials), "—" placeholder |
| Doctor ratings & reviews | `GET /api/doctor/GetReviews/{doctorId}` | Empty array (no rating shown) |

### New Backend API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/doctor/UpdateExtra` | POST | Admin | Saves bio, clinicAddress, consultationFee, governorate, photoBase64 for a doctor |
| `/api/doctor/GetExtra/{doctorId}` | GET | Patient, Admin | Returns extra info for a specific doctor |
| `/api/doctor/SubmitReview` | POST | Patient | Patient submits a review (1-5 + comment). One per patient per doctor (upsert) |
| `/api/doctor/GetReviews/{doctorId}` | GET | Public | Returns all reviews for a doctor |

### New Database Tables

**`DoctorExtras` table:**
| Column | Type | Constraint |
|--------|------|------------|
| `Id` | int | PK, auto-increment |
| `DoctorId` | string | FK → Doctors.Id, unique |
| `Bio` | nvarchar(1000) | nullable |
| `ClinicAddress` | nvarchar(500) | nullable |
| `ConsultationFee` | decimal(10,2) | nullable |
| `Governorate` | nvarchar(100) | nullable |
| `PhotoBase64` | nvarchar(max) | nullable |
| `UpdatedAt` | datetime2 | default UTC now |

**`DoctorReviews` table:**
| Column | Type | Constraint |
|--------|------|------------|
| `Id` | int | PK, auto-increment |
| `DoctorId` | string | FK → Doctors.Id |
| `PatientId` | string | FK → Patients.Id |
| `Rating` | int | 1-5, required |
| `Comment` | nvarchar(300) | nullable |
| `CreatedAt` | datetime2 | default UTC now |
| `UpdatedAt` | datetime2 | default UTC now |
| | | Unique constraint on (DoctorId, PatientId) |

### New .NET Backend Files

#### [NEW] [DoctorExtra.cs](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.Domain/Entities/DoctorExtra.cs)
- Entity with: `Id` (int, PK), `DoctorId` (string, FK, unique), `Bio`, `ClinicAddress`, `ConsultationFee`, `Governorate`, `PhotoBase64`, `UpdatedAt`
- Navigation property: `Doctor Doctor`

#### [NEW] [DoctorReview.cs](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.Domain/Entities/DoctorReview.cs)
- Entity with: `Id` (int, PK), `DoctorId` (string, FK), `PatientId` (string, FK), `Rating` (int, 1-5), `Comment` (string, max 300), `CreatedAt`, `UpdatedAt`
- Navigation properties: `Doctor Doctor`, `Patient Patient`

#### [MODIFY] [Doctor.cs](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.Domain/Entities/Doctor.cs)
- Add navigation: `public DoctorExtra? Extra { get; set; }`
- Add navigation: `public ICollection<DoctorReview> Reviews { get; set; } = new List<DoctorReview>();`

#### [MODIFY] [Patient.cs](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.Domain/Entities/Patient.cs)
- Add navigation: `public ICollection<DoctorReview> DoctorReviews { get; set; } = new List<DoctorReview>();`

#### [MODIFY] [AppDbContext.cs](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.Infrastructure/Context/AppDbContext.cs)
- Add `public DbSet<DoctorExtra> DoctorExtras { get; set; }`
- Add `public DbSet<DoctorReview> DoctorReviews { get; set; }`
- In `OnModelCreating`: add unique index on `DoctorExtra.DoctorId`, composite unique on `DoctorReview.(DoctorId, PatientId)`

#### [NEW] [DoctorExtraFeature/](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.Core/Features/DoctorExtraFeature/) — CQRS handlers
- `Command/Model/UpdateDoctorExtraCommand.cs` — MediatR command for `POST /api/doctor/UpdateExtra`
- `Command/Handler/UpdateDoctorExtraHandler.cs` — handler that upserts `DoctorExtra` by DoctorId
- `Command/Model/SubmitDoctorReviewCommand.cs` — MediatR command for `POST /api/doctor/SubmitReview`
- `Command/Handler/SubmitDoctorReviewHandler.cs` — handler that upserts `DoctorReview` by (DoctorId, PatientId)
- `Query/Model/GetDoctorExtraQuery.cs` — MediatR query for `GET /api/doctor/GetExtra/{doctorId}`
- `Query/Handler/GetDoctorExtraHandler.cs`
- `Query/Response/GetDoctorExtraResponse.cs`
- `Query/Model/GetDoctorReviewsQuery.cs` — MediatR query for `GET /api/doctor/GetReviews/{doctorId}`
- `Query/Handler/GetDoctorReviewsHandler.cs`
- `Query/Response/GetDoctorReviewsResponse.cs`

#### [NEW] [IDoctorExtraService.cs](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.Service/Abstracts/IDoctorExtraService.cs)
- Interface with: `UpdateExtraAsync`, `GetExtraAsync`, `SubmitReviewAsync`, `GetReviewsAsync`

#### [NEW] [DoctorExtraService.cs](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.Service/Implementation/DoctorExtraService.cs)
- Implementation of `IDoctorExtraService` using `AppDbContext`

#### [MODIFY] [DoctorController.cs](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.API/Controllers/DoctorController.cs)
- Add 4 new action methods: `UpdateExtra`, `GetExtra`, `SubmitReview`, `GetReviews`
- Uses MediatR pattern consistent with existing controller

#### [MODIFY] [ModuleIServiceDependancies.cs](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.Service/ModuleIServiceDependancies.cs)
- Register `IDoctorExtraService` → `DoctorExtraService` in DI

### New Frontend Files

#### [NEW] [page.tsx](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/app/%5Blocale%5D/%28app%29/our-doctors/page.tsx)
- Main "Our Doctors" page component
- Fetches doctor list from `GET /api/appointment/GetDoctors` (available to Patient + Admin)
- For each doctor, fetches extra info from `GET /api/doctor/GetExtra/{id}` (batched)
- Implements filter bar: Specialization (multi-select dropdown), Governorate (multi-select dropdown), Rating (conditional)
- Renders doctor cards in a responsive grid
- Rating display logic (see business rules below)
- Clicking a doctor card → opens `DoctorProfileModal`
- Admin role: shows "Edit Info" button on each card

#### [NEW] [DoctorProfileModal.tsx](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/components/doctor/DoctorProfileModal.tsx)
- Full-screen modal/drawer when clicking a doctor card
- Sections: Large photo, name, specialization, governorate, bio, clinic address, consultation fee
- Patient reviews list fetched from `GET /api/doctor/GetReviews/{doctorId}`: username (or "Anonymous"), star rating (1-5), comment text, date
- "Submit Review" form at bottom (for logged-in patients only): calls `POST /api/doctor/SubmitReview`
- Each patient can only review each doctor once (backend enforces unique constraint)
- Photo upload: Doctor can upload their own photo (base64 sent via `POST /api/doctor/UpdateExtra`)

#### [NEW] [DoctorEditModal.tsx](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/components/admin/DoctorEditModal.tsx)
- Admin-only modal to edit doctor extra info
- Form fields: bio (textarea), clinic address (text), consultation fee (number), governorate (dropdown of Egyptian governorates), photo upload
- Saves via `POST /api/doctor/UpdateExtra`

#### [NEW] [doctorExtraService.ts](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/services/doctorExtraService.ts)
- `updateExtra(doctorId, payload)` → `POST /api/doctor/UpdateExtra`
- `getExtra(doctorId)` → `GET /api/doctor/GetExtra/{doctorId}`
- `submitReview(doctorId, rating, comment)` → `POST /api/doctor/SubmitReview`
- `getReviews(doctorId)` → `GET /api/doctor/GetReviews/{doctorId}`

### Files to Modify

#### [MODIFY] [SideNavBar.tsx](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/components/layout/SideNavBar.tsx)
- Add nav item for Patient: `{ key: 'ourDoctors', icon: 'medical_services', href: '/our-doctors', roles: ['Patient'] }`
- Add nav item for Admin: `{ key: 'ourDoctors', icon: 'medical_services', href: '/our-doctors', roles: ['Admin'] }`
- Position: after "Appointments" for Patient, after "Doctors" for Admin

#### [MODIFY] [proxy.ts](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/proxy.ts)
- Add `/our-doctors` to `MULTI_ROLE_ROUTES` with `['Patient', 'Admin']`

#### [MODIFY] [ar.json](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/messages/ar.json)
- Add `nav.ourDoctors`: `"أطباؤنا"`
- Add new `ourDoctors` namespace with keys:
  - `title`, `subtitle`, `filterSpecialization`, `filterGovernorate`, `filterRating`, `totalDoctors`, `noResults`, `allSpecializations`, `allGovernorates`, `reviews`, `noReviews`, `submitReview`, `yourRating`, `yourComment`, `submitBtn`, `editBtn`, `bio`, `clinicAddress`, `consultationFee`, `anonymous`, `reviewSubmitted`, `alreadyReviewed`, `stars`, `editDoctorInfo`, `saveDoctorInfo`, `photoUpload`, `governorates.*` (28 Egyptian governorates)

#### [MODIFY] [en.json](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/messages/en.json)
- Add matching English keys for all of the above

### Rating Display Business Logic (Critical)

```
function shouldShowRating(doctors, filters):
  visibleDoctors = applyFilters(doctors, filters)
  
  if filters.specializations.length === 1:
    # Count ALL doctors with this specialization (not just filtered)
    totalInSpec = countDoctorsWithSpecialization(allDoctors, filters.specializations[0])
    return totalInSpec >= 10
  
  if filters.governorates.length === 1:
    totalInGov = countDoctorsInGovernorate(allDoctors, filters.governorates[0])
    return totalInGov >= 5
  
  if filters.governorates.length >= 2:
    totalInGovs = countDoctorsInGovernorates(allDoctors, filters.governorates)
    return totalInGovs >= 10
  
  # No filter or multiple specialization filters
  return allDoctors.length >= 10
```

- When rating IS shown: sort by average rating (descending), then alphabetically
- When rating is NOT shown: sort alphabetically only, hide star ratings from cards

### Egyptian Governorates List (28)
Cairo, Giza, Alexandria, Dakahlia, Red Sea, Beheira, Fayoum, Gharbia, Ismailia, Menofia, Minya, Qalyubia, New Valley, Suez, Aswan, Assiut, Beni Suef, Port Said, Damietta, Sharkia, South Sinai, Kafr El Sheikh, Matrouh, Luxor, Qena, North Sinai, Sohag, Helwan

### New Packages Needed
- None — uses existing Material Symbols and vanilla CSS/React

### EF Core Migration
```bash
cd MedScanAI-master/MedScanAI.API
dotnet ef migrations add AddDoctorExtrasAndReviews --project ../MedScanAI.Infrastructure
dotnet ef database update --project ../MedScanAI.Infrastructure
```

### Implementation Order
1. Create `DoctorExtra.cs` and `DoctorReview.cs` entities
2. Update `Doctor.cs` and `Patient.cs` navigation properties
3. Update `AppDbContext.cs` with DbSets and model config
4. Run EF migration
5. Create `IDoctorExtraService` interface + `DoctorExtraService` implementation
6. Register in DI (`ModuleIServiceDependancies.cs`)
7. Create CQRS features (`DoctorExtraFeature/` — commands + queries + handlers)
8. Add 4 new actions to `DoctorController.cs`
9. Add seeded data in `DataSeeder.cs` → `SeedDoctorExtrasAsync()`
10. Create frontend `doctorExtraService.ts`
11. Create `proxy.ts` route entry
12. Create `DoctorProfileModal.tsx`
13. Create `DoctorEditModal.tsx` (Admin)
14. Create `our-doctors/page.tsx` with filter logic and rating rules
15. Add sidebar nav items
16. Add all i18n keys

---

## Section B: Website Experience Rating (User Testimonials)

### Overview

Patients can rate their overall experience with MediScan AI (1-5 stars + comment). Reviews appear as a testimonials carousel on the landing page.

### Storage Strategy — ✅ RESOLVED: Backend Endpoints

All data persists via the .NET backend. No localStorage.

### New Backend API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/review/Submit` | POST | Patient | Patient submits a website review (1-5 + comment). One per patient (upsert) |
| `/api/review/GetAll` | GET | Public | Returns all website reviews ordered by most recent. No auth needed for landing page |

### New Database Table

**`WebsiteReviews` table:**
| Column | Type | Constraint |
|--------|------|------------|
| `Id` | int | PK, auto-increment |
| `PatientId` | string | FK → Patients.Id, unique |
| `FirstName` | nvarchar(100) | extracted from Patient.FullName (first word) |
| `Rating` | int | 1-5, required |
| `Comment` | nvarchar(300) | nullable |
| `CreatedAt` | datetime2 | default UTC now |
| `UpdatedAt` | datetime2 | default UTC now |

### New .NET Backend Files

#### [NEW] [WebsiteReview.cs](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.Domain/Entities/WebsiteReview.cs)
- Entity with: `Id` (int, PK), `PatientId` (string, FK, unique), `FirstName`, `Rating`, `Comment`, `CreatedAt`, `UpdatedAt`
- Navigation property: `Patient Patient`

#### [MODIFY] [Patient.cs](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.Domain/Entities/Patient.cs)
- Add navigation: `public WebsiteReview? WebsiteReview { get; set; }`

#### [MODIFY] [AppDbContext.cs](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.Infrastructure/Context/AppDbContext.cs)
- Add `public DbSet<WebsiteReview> WebsiteReviews { get; set; }`
- In `OnModelCreating`: add unique index on `WebsiteReview.PatientId`

#### [NEW] [ReviewFeature/](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.Core/Features/ReviewFeature/) — CQRS handlers
- `Command/Model/SubmitWebsiteReviewCommand.cs` — MediatR command for `POST /api/review/Submit`
- `Command/Handler/SubmitWebsiteReviewHandler.cs` — handler that upserts `WebsiteReview` by PatientId
- `Query/Model/GetAllWebsiteReviewsQuery.cs` — MediatR query for `GET /api/review/GetAll`
- `Query/Handler/GetAllWebsiteReviewsHandler.cs`
- `Query/Response/WebsiteReviewResponse.cs`

#### [NEW] [IReviewService.cs](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.Service/Abstracts/IReviewService.cs)
- Interface with: `SubmitAsync`, `GetAllAsync`

#### [NEW] [ReviewService.cs](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.Service/Implementation/ReviewService.cs)
- Implementation of `IReviewService` using `AppDbContext`

#### [NEW] [ReviewController.cs](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.API/Controllers/ReviewController.cs)
- Route: `api/review/[action]`
- `[HttpPost] [Authorize(Roles = "Patient")] Submit` → sends `SubmitWebsiteReviewCommand` via MediatR
- `[HttpGet] [AllowAnonymous] GetAll` → sends `GetAllWebsiteReviewsQuery` via MediatR

#### [MODIFY] [ModuleIServiceDependancies.cs](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.Service/ModuleIServiceDependancies.cs)
- Register `IReviewService` → `ReviewService` in DI

### Review Data Shape (Frontend TypeScript)

```typescript
interface WebsiteReviewResponse {
  id: number;
  patientId: string;
  firstName: string;
  rating: number;      // 1-5
  comment: string;     // max 300 chars
  createdAt: string;   // ISO date
}
```

### New Frontend Files

#### [NEW] [reviewService.ts](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/services/reviewService.ts)
- `submitReview(rating, comment)` → `POST /api/review/Submit`
- `getAllReviews()` → `GET /api/review/GetAll`

#### [NEW] [RateExperienceModal.tsx](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/components/ui/RateExperienceModal.tsx)
- Modal with 1-5 interactive star selector (hover to preview, click to select)
- Optional comment textarea (max 300 chars, char counter)
- Submit button calls `POST /api/review/Submit` via `reviewService`
- If user already has a review, pre-fills the form for editing (fetch existing via `GET /api/review/GetAll` and filter by userId)
- Only accessible to `Patient` role (not Doctor or Admin)

#### [NEW] [TestimonialsSection.tsx](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/components/home/TestimonialsSection.tsx)
- Landing page section: "آراء مستخدمينا" / "What Our Users Say"
- Fetches reviews from `GET /api/review/GetAll` on mount
- Shows maximum 6 most recent reviews as cards
- Each card: star rating (filled/empty stars), comment text, first name only, date
- "See All" button if more than 6 reviews exist (expands to show all, or navigates to separate page)
- **Critical rule**: If fewer than 3 reviews exist, do NOT render this section at all
- Data comes from backend (seeded on first run)
- Animated cards with stagger delay (consistent with landing page style)

### Files to Modify

#### [MODIFY] [page.tsx (Landing)](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/app/%5Blocale%5D/page.tsx)
- Import and render `<TestimonialsSection />` between the Features section and the About/CTA section
- Pass no props — the component fetches from `GET /api/review/GetAll` internally

#### [MODIFY] [SideNavBar.tsx](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/components/layout/SideNavBar.tsx) — ✅ RESOLVED: Sidebar footer button
- Add a "Rate Us" button in the **footer area** of the sidebar (above logout), Patient role only
- Icon: `star_rate`
- Clicking opens `RateExperienceModal`

#### [MODIFY] [ar.json](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/messages/ar.json)
- Add `nav.rateUs`: `"قيّم تجربتك"`
- Add new `testimonials` namespace:
  - `title`, `subtitle`, `seeAll`, `rateTitle`, `rateSubtitle`, `yourRating`, `comment`, `commentPlaceholder`, `submit`, `update`, `thankYou`, `maxChars`, `stars1`-`stars5` (Terrible, Bad, OK, Good, Excellent)

#### [MODIFY] [en.json](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/messages/en.json)
- Add matching English keys

### Seeded Sample Reviews — in `DataSeeder.cs`

Add `SeedWebsiteReviewsAsync()` method to [DataSeeder.cs](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.Infrastructure/Seeders/DataSeeder.cs). Runs on startup if `WebsiteReviews` table is empty.

**6 seeded website reviews:**
| FirstName | Rating | Comment | Relative Date |
|-----------|--------|---------|---------------|
| Ahmed M. | ★★★★★ | منصة رائعة ساعدتني في تشخيص مبكر وأنقذت وقتي | 3 days ago |
| Sara A. | ★★★★★ | The AI diagnosis tools are incredibly accurate and fast | 5 days ago |
| Mohamed K. | ★★★★☆ | خدمة ممتازة وتقارير طبية احترافية جداً | 1 week ago |
| Nour H. | ★★★★★ | أفضل منصة طبية جربتها، سهلة الاستخدام ودقيقة | 1 week ago |
| Youssef T. | ★★★☆☆ | Good platform overall, looking forward to more features | 2 weeks ago |
| Dina R. | ★★★★★ | الذكاء الاصطناعي دقيق جداً وساعدني أفهم نتائج التحاليل | 2 weeks ago |

**Seeded doctor reviews** — `SeedDoctorReviewsAsync()`:
- 2-3 reviews per existing doctor in the system (use existing doctor IDs from DB)
- Realistic Arabic/English comments and varied ratings (3-5 stars)

**Seeded doctor extras** — `SeedDoctorExtrasAsync()`:
- Governorate, bio, and clinic address for each existing doctor
- Example: Cairo, "طبيب متخصص في ...", "123 شارع التحرير، القاهرة"

### EF Core Migration

This migration is shared with Section A (same `AddDoctorExtrasAndReviews` migration adds all 3 tables).

### New Packages Needed
- None

### Implementation Order
1. Create `WebsiteReview.cs` entity (alongside Section A entities)
2. Update `Patient.cs` navigation property
3. Update `AppDbContext.cs` with DbSet
4. Run shared EF migration (done in Section A step)
5. Create `IReviewService` interface + `ReviewService` implementation
6. Register in DI
7. Create CQRS features (`ReviewFeature/` — command + query + handlers)
8. Create `ReviewController.cs`
9. Add seeded data in `DataSeeder.cs` → `SeedWebsiteReviewsAsync()`
10. Create frontend `reviewService.ts`
11. Create `RateExperienceModal.tsx`
12. Create `TestimonialsSection.tsx`
13. Add testimonials section to landing page
14. Add "Rate Us" button to sidebar footer
15. Add all i18n keys

---

## Section C: Website Logo as Browser Tab Favicon

### Current State (Research Results)

| Item | Status |
|------|--------|
| `src/app/favicon.ico` | ✅ **Exists** (25,931 bytes) — Next.js auto-serves this from `src/app/favicon.ico` |
| `public/images/mediscan-logo.png` | ✅ Exists (392 KB) |
| `public/images/mediscan-logo-svg.svg` | ✅ Exists (14 KB) |
| `src/app/[locale]/layout.tsx` metadata | ❌ No `icons` field in `generateMetadata()` — only `title`, `description`, `keywords` |
| `<link rel="icon">` in `<head>` | ❌ Not present |
| Tab title | ✅ Already shows "MediScan AI — ..." via `metaTitle` translation key |

### Analysis

Next.js 14+ automatically serves `src/app/favicon.ico` as the favicon **if the file exists in the `app` directory**. Since `favicon.ico` already exists at `src/app/favicon.ico`, the favicon **should already be working**.

However, to ensure it works correctly across all browsers and to add higher-quality icons (SVG, Apple touch icon), we should explicitly declare icons in the metadata.

### Files to Modify

#### [MODIFY] [layout.tsx](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/app/%5Blocale%5D/layout.tsx)
- Add `icons` to the `generateMetadata()` return object:
  ```
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/images/mediscan-logo-svg.svg', type: 'image/svg+xml' },
    ],
    apple: '/images/mediscan-logo.png',
  }
  ```
- This ensures: `.ico` fallback for older browsers, SVG for modern browsers, Apple touch icon for iOS

### Files to Verify (No Changes Needed)
- `src/app/favicon.ico` — already exists, no change
- `public/images/mediscan-logo-svg.svg` — already exists, serves as high-quality icon
- `public/images/mediscan-logo.png` — already exists, serves as Apple touch icon

### New i18n Keys
- None needed — tab title already works via `metaTitle`

### New Packages Needed
- None

### Implementation Order
1. Add `icons` field to `generateMetadata()` in `layout.tsx`
2. Verify favicon appears in browser tab across Chrome, Firefox, Safari

### Open Questions
- None — this is a straightforward metadata addition

---

## Updated Summary of All Changes

### Frontend Files

| # | Change | Files | Severity |
|---|--------|-------|----------|
| 1 | Fix Report Drawer auto-open bug | `doctor/appointments/page.tsx` | 🔴 Critical |
| 2 | Fix AI Tools navigation for Doctor role | `SideNavBar.tsx`, `proxy.ts` | 🟡 Medium |
| 3 | Enhance Doctor Profile page | `doctor/profile/page.tsx`, `ar.json`, `en.json` | 🟢 Enhancement |
| 4 | AI Tools hub redesign + icon consistency | `page.tsx` (landing), `ai-tools/page.tsx` | 🟡 Medium |
| 5 | Functional Search Bar | `TopNavBar.tsx`, `ar.json`, `en.json` | 🟢 Enhancement |
| A | "Our Doctors" directory page | `our-doctors/page.tsx`, `DoctorProfileModal.tsx`, `DoctorEditModal.tsx`, `doctorExtraService.ts`, `SideNavBar.tsx`, `proxy.ts`, `ar.json`, `en.json` | 🟢 Major Feature |
| B | Website Experience Rating + Testimonials | `RateExperienceModal.tsx`, `TestimonialsSection.tsx`, `reviewService.ts`, `page.tsx` (landing), `SideNavBar.tsx`, `ar.json`, `en.json` | 🟢 Major Feature |
| C | Favicon in browser tab | `layout.tsx` | 🟢 Quick Fix |

### Backend Files (.NET)

| # | Change | Files | Layer |
|---|--------|-------|-------|
| A | Doctor Extra + Reviews entities | `DoctorExtra.cs`, `DoctorReview.cs` | Domain |
| A | Doctor entity navigation update | `Doctor.cs` (modify) | Domain |
| A | CQRS features for doctor extras/reviews | `DoctorExtraFeature/` (10 files) | Core |
| A | Doctor Extra service | `IDoctorExtraService.cs`, `DoctorExtraService.cs` | Service |
| A | Doctor controller new actions | `DoctorController.cs` (modify) | API |
| B | Website Review entity | `WebsiteReview.cs` | Domain |
| B | Patient entity navigation update | `Patient.cs` (modify) | Domain |
| B | CQRS features for website reviews | `ReviewFeature/` (5 files) | Core |
| B | Review service | `IReviewService.cs`, `ReviewService.cs` | Service |
| B | Review controller | `ReviewController.cs` (new) | API |
| A+B | DbContext update | `AppDbContext.cs` (modify) | Infrastructure |
| A+B | EF Migration | `AddDoctorExtrasAndReviews` | Infrastructure |
| A+B | Data seeder update | `DataSeeder.cs` (modify) | Infrastructure |
| A+B | DI registration | `ModuleIServiceDependancies.cs` (modify) | Service |

### Total File Count
- **Frontend**: ~12 new/modified files
- **Backend**: ~20 new/modified files
- **i18n**: 2 files (ar.json, en.json)

## Updated Verification Plan

### Additional Manual Verification
8. **Our Doctors (Patient)**: Navigate to "أطباؤنا" → see doctor cards with seeded data → filter by specialization → check rating visibility rules
9. **Our Doctors (Admin)**: Login as Admin → navigate to "Our Doctors" → click "Edit" on a doctor → update bio/address/fees → verify persisted in DB
10. **Doctor Profile Modal**: Click a doctor card → see full profile, reviews from DB, clinic info
11. **Rating Rules**: Set up test data with <10 doctors → confirm ratings are hidden. Add 10+ → confirm ratings appear
12. **Rate Experience**: Login as Patient → click "Rate Us" → submit rating → verify it appears in landing page testimonials
13. **Testimonials (Landing)**: Visit landing page → see testimonials section with 6 seeded reviews → verify it hides when <3 reviews
14. **Favicon**: Open any page → check browser tab shows MediScan AI logo
15. **Backend API**: Test all 6 new endpoints via Swagger:
    - `POST /api/doctor/UpdateExtra` — 200 OK
    - `GET /api/doctor/GetExtra/{id}` — returns seeded data
    - `POST /api/doctor/SubmitReview` — 200 OK, verify upsert
    - `GET /api/doctor/GetReviews/{id}` — returns seeded reviews
    - `POST /api/review/Submit` — 200 OK
    - `GET /api/review/GetAll` — returns 6 seeded reviews
