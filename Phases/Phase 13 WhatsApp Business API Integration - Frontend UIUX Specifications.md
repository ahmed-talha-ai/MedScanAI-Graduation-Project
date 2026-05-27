# WhatsApp Business API Integration — Implementation Plan

Based on [Sebar_Master_Specifications_v2.md](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/Phases/Sebar_Master_Specifications_v2.md) § 5

---

## Background

The specification requires integrating the official **Meta WhatsApp Business Cloud API** into the existing `.NET 8` MedScanAI backend to power two automated messaging pipelines:

1. **Immediate appointment booking confirmation** — sends a WhatsApp message to the patient right after a successful booking
2. **Monthly breast self-check reminder** — a background scheduler dispatches campaign messages to all female patients daily at 09:00 AM UTC

The backend follows a **Clean Architecture** pattern:
- `MedScanAI.Domain` → Entities & Enums
- `MedScanAI.Infrastructure` → DbContext, Repositories, DI
- `MedScanAI.Service` → Abstracts (interfaces) & Implementation (concrete classes)
- `MedScanAI.Core` → MediatR Features (Command/Query + Handlers)
- `MedScanAI.API` → Controllers, Program.cs, appsettings.json

---

## Proposed Changes

### Component 1 — Configuration

#### [MODIFY] [appsettings.json](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.API/appsettings.json)

Add the `WhatsAppSettings` section at the root level of `appsettings.json`:

```json
"WhatsAppSettings": {
  "ApiUrl": "https://graph.facebook.com/v25.0/",
  "PhoneNumberId": "1065453269974512",
  "AccessToken": "EAF5KBhbrzbgBQZCEMXKYnd2t2AUVa7lJkqymxAyDGbfK5ED0VV6zFTQ550LKy8Q5smeLSbWYfTnZBiW3XYaupfXmuekWun8FF6gNkqfXB"
}
```

> [!NOTE]
> The token and IDs are taken directly from the specification document. In a production deployment these should move to user-secrets or environment variables, but for now they go into `appsettings.json` as the spec dictates.

---

### Component 2 — WhatsApp Service (Service Layer)

Following the existing pattern in `MedScanAI.Service/`:
- Interfaces live in `Abstracts/`
- Concrete implementations live in `Implementation/`

#### [NEW] [IWhatsAppService.cs](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.Service/Abstracts/IWhatsAppService.cs)

```csharp
namespace MedScanAI.Service.Abstracts
{
    public interface IWhatsAppService
    {
        Task SendBreastCheckReminderAsync(string patientPhone, string patientName, string examinationSlug);
        Task SendAppointmentReminderAsync(string patientPhone, string patientName, string appointmentDate, string appointmentTime);
    }
}
```

#### [NEW] [WhatsAppService.cs](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.Service/Implementation/WhatsAppService.cs)

- Inject `HttpClient` (typed) and `IConfiguration` via constructor
- Read `WhatsAppSettings:ApiUrl`, `PhoneNumberId`, `AccessToken` from config
- Build Meta-compliant JSON payloads for each template
- POST to `{ApiUrl}{PhoneNumberId}/messages` with `Authorization: Bearer {AccessToken}`
- **Error Logging Directive:** If `!response.IsSuccessStatusCode`, read the full error body string from Meta's response and log it at `LogError` level via `ILogger<WhatsAppService>`
- Phone normalization: ensure Egypt `+2` prefix for E.164 compliance

**Method A — `SendBreastCheckReminderAsync`:**
- Template name: `breast_self_check`, Language: `ar`
- Body component: 1 parameter `{{1}}` → `patientName`
- Button component: 1 URL button with text parameter → `examinationSlug`

**Method B — `SendAppointmentReminderAsync`:**
- Template name: `appointment_reminder`, Language: `ar`
- Body component: 3 parameters `{{1}}` → `patientName`, `{{2}}` → `appointmentDate`, `{{3}}` → `appointmentTime`

---

### Component 3 — Dependency Injection Registration

#### [MODIFY] [ModuleIServiceDependancies.cs](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.Service/ModuleIServiceDependancies.cs)

> [!IMPORTANT]
> The spec says to register in `Program.cs` using `builder.Services.AddHttpClient<IWhatsAppService, WhatsAppService>()`, but the project's established pattern centralizes all service registrations in `ModuleIServiceDependancies.cs`. 
>
> **Decision:** Register the typed `HttpClient` in `Program.cs` (since `AddHttpClient<>` is a special extension that needs to run before DI is built), and keep a matching line in `ModuleIServiceDependancies.cs` if needed for consistency. The typed HttpClient pattern **must** be registered separately from `AddTransient`.

#### [MODIFY] [Program.cs](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.API/Program.cs)

Add the typed HttpClient registration after the existing `builder.Services.AddHttpClient();` line (~line 68):

```csharp
builder.Services.AddHttpClient<IWhatsAppService, WhatsAppService>();
```

This replaces the generic `AddHttpClient()` for WhatsApp with a typed registration that enables proper DI injection of `HttpClient` into `WhatsAppService`.

---

### Component 4 — Appointment Booking Notification Hook

The appointment booking flow is:
1. `AppointmentController.BookAppointment` → MediatR → `AppointmentCommandHandler.Handle(BookAppointmentCommand)` → `AppointmentService.BookAppointmentAsync`
2. Inside `BookAppointmentAsync`, after the SignalR event fires, the appointment is persisted.

**Integration point:** Inject `IWhatsAppService` into `AppointmentService` and call `SendAppointmentReminderAsync` right after the successful `AddAsync` + SignalR dispatch.

#### [MODIFY] [AppointmentService.cs](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.Service/Implementation/AppointmentService.cs)

Changes:
- Add `IWhatsAppService` to the constructor
- In `BookAppointmentAsync`, after `_hubContext.Clients.All.SendAsync("AppointmentCreated", ...)`:
  - Look up the patient's phone number from the appointment data
  - Call `_whatsAppService.SendAppointmentReminderAsync(phone, name, date, time)` inside a fire-and-forget `try-catch` (failure must not block the booking response)
- Apply the same logic in `BookAppointmentByAdminAsync`

> [!NOTE]
> The `Patient` entity already has `PhoneNumber` (line 25 of [Patient.cs](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.Domain/Entities/Patient.cs)). We already look up the patient in the booking method to set `PatientName`, so we can reuse that same query result to get the phone number.

---

### Component 5 — Breast Self-Check Campaign Background Scheduler

#### [NEW] [BreastCheckCampaignScheduler.cs](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.Service/Implementation/BreastCheckCampaignScheduler.cs)

A `BackgroundService` that:
1. Runs a `while (!stoppingToken.IsCancellationRequested)` loop
2. Calculates the next 09:00 AM UTC and `await Task.Delay(timeUntilNext, stoppingToken)`
3. Creates a scoped DI context via `IServiceScopeFactory`
4. Queries `AppDbContext.Patients` for female patients with a phone number:
   ```csharp
   context.Patients
       .Where(p => p.Gender == "Female" && p.PhoneNumber != null)
       .ToListAsync();
   ```
5. Iterates through results calling `SendBreastCheckReminderAsync(phone, name, "breast-examination-hub")`
6. Each iteration is wrapped in its own `try-catch` — a single failed dispatch **never** crashes the loop or blocks other patients
7. Uses `ILogger<BreastCheckCampaignScheduler>` for structured logging

> [!IMPORTANT]
> The `Patient.Gender` field is stored as `string` (type `[MaxLength(10)] public string Gender`), not as the `Gender` enum. The query filter will use the string `"Female"` rather than `Gender.Female`. The existing registration flow in `AuthenticationService.cs` stores it as a string.

#### [MODIFY] [Program.cs](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.API/Program.cs)

Register the hosted service:

```csharp
builder.Services.AddHostedService<BreastCheckCampaignScheduler>();
```

---

## Summary of All File Changes

| Action | Layer | File | Description |
|--------|-------|------|-------------|
| MODIFY | API | `appsettings.json` | Add `WhatsAppSettings` section |
| NEW | Service/Abstracts | `IWhatsAppService.cs` | Interface with 2 async methods |
| NEW | Service/Implementation | `WhatsAppService.cs` | Typed HttpClient + Meta API POST + error logging |
| NEW | Service/Implementation | `BreastCheckCampaignScheduler.cs` | BackgroundService for daily breast-check reminders |
| MODIFY | Service/Implementation | `AppointmentService.cs` | Inject IWhatsAppService, fire notifications on booking |
| MODIFY | API | `Program.cs` | Register `AddHttpClient<IWhatsAppService, WhatsAppService>()` + `AddHostedService<BreastCheckCampaignScheduler>()` |

---

## Verification Plan (Backend)

### Automated Tests
- Build the solution with `dotnet build` to confirm zero compilation errors
- Verify DI resolves correctly at startup (the app boots without `InvalidOperationException`)

### Manual Verification
- Book an appointment via the frontend → check server logs for WhatsApp API call result
- Check `ILogger` output for structured error logging when Meta returns non-2xx (can test with an invalid phone number)
- Verify the background scheduler starts and logs its first "next run at" timestamp

---
---

# Frontend UI/UX Specifications — Implementation Plan

Based on [Sebar_Master_Specifications_v2.md](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/Phases/Sebar_Master_Specifications_v2.md) §1, §2, §3

---

## Audit Summary

After examining the current frontend, here is the gap analysis between the spec and the existing codebase:

| Spec Section | Current State | Gap |
|---|---|---|
| §1 Design Tokens (Light/Dark) | Light tokens exist in `globals.css`. Dark mode tokens partially defined | Dark mode values need updating to match spec's "galactic midnight" palette + neon accents |
| §2A Laser-Scan Preloader | No preloader exists | Full preloader component needed |
| §2B Tab Fluid Indicator | Sidebar uses static `bg-primary-container/20` highlight | Need animated sliding indicator with `layoutId` concept |
| §2C Elastic-Bounce Cards | AI tools cards have `hover:-translate-y-1` only | Need stronger elastic bounce + neon shadow aura in dark mode |
| §3A Landing Hero | Text-based hero exists. No mesh gradient, no 3D body model | Add CSS mesh gradient background + bento grid layout for model cards |
| §3A Registration Stepper | Onboarding page exists but uses fade transitions | Add `AnimatePresence`-style slide left/right transitions |
| §3B Accordion Self-Exam | Current uses `ExamWizard` (one card at a time with slide) | Needs refactoring to accordion stack pattern per spec |
| §3C Terminal Advice Panels | Completion view shows generic "complete" text | Replace with the spec's empathetic bilingual advice panels |
| §3D Children's Suite | Basic icon cards exist, no 3D assets, no pastel bento grid | Major UI upgrade: pastel cards, hero banner, elastic springs |

---

## Proposed Frontend Changes

### Component 6 — Dark Mode Design Tokens Update

#### [MODIFY] [globals.css](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/app/globals.css)

Update the `.dark` selector to match the spec's "Premium Cinematic" dark mode palette:

```css
.dark {
  --md-background: #0A0F1D;          /* Deep galactic midnight (spec §1B) */
  --md-surface: #0A0F1D;
  --md-surface-container-lowest: #111827;
  --md-surface-container-low: #1E293B;
  --md-surface-container: rgba(30, 41, 59, 0.40);  /* 40% opacity glassmorphism */
  --md-surface-container-high: rgba(30, 41, 59, 0.60);
  /* ... remaining tokens unchanged ... */
}
```

Add new neon accent CSS custom properties for dark mode only:

```css
.dark {
  --neon-cyan: #00F2FE;    /* Scanning Cyan — tissue scanners (spec §1B) */
  --neon-purple: #9D4EDD;  /* Diagnostic Purple — neurological (spec §1B) */
}
```

Add a `@utility` for glassmorphism panels:

```css
@utility glass-panel {
  background: rgba(30, 41, 59, 0.40);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.10);
}
```

---

### Component 7 — Laser-Scan Preloader

#### [NEW] `src/components/ui/Preloader.tsx`

A full-screen component shown once on first app visit:
- Full-screen overlay matching the active theme background
- Centered MediScan AI logo with a horizontal light-shimmer CSS animation (simulating a medical laser pass)
- After the shimmer animation completes (~1.2s), fade out the entire overlay (`opacity: 0` over 400ms)
- Use `sessionStorage` to ensure it only shows once per browser session
- Child components slide up from `translate3d(0, 12px, 0)` after preloader exits

#### [MODIFY] [layout.tsx](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/app/[locale]/layout.tsx)

Wrap `{children}` with the `<Preloader>` component so it fires on first load.

#### [MODIFY] [globals.css](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/app/globals.css)

Add `@keyframes laser-shimmer` animation:
```css
@keyframes laser-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

---

### Component 8 — Elastic-Bounce & Neon Glow for Diagnostic Cards

#### [MODIFY] [page.tsx (ai-tools hub)](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/app/[locale]/(app)/dashboard/ai-tools/page.tsx)

Update each tool card's `className` to include the spec's elastic bounce hover:

```
hover:-translate-y-2 hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(0,242,254,0.15)]
```

The neon shadow color (`rgba(0,242,254,0.15)`) activates the spec's "Active Scanning Cyan" aura in dark mode. In light mode, the existing `ambient-shadow` hover is sufficient.

#### [MODIFY] [page.tsx (landing)](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/app/[locale]/page.tsx)

**Model cards section** (~line 250+): Restructure the flat row layout into an **asymmetric bento grid** with CSS Grid:
- Brain Tumor + Breast Cancer cards span 2 columns (large)
- Skin, X-Ray, Lab OCR, Chatbot cards are standard 1-column cells
- All cards wrapped in `glass-panel` in dark mode, `ghost-border` in light mode

**Hero section**: Add a CSS mesh gradient canvas behind the hero using `background: conic-gradient(from 180deg at 50% 50%, #006666, #007BFF, #6366F1, #006666)` with the existing `anim-gradient-shift` class.

---

### Component 9 — Self-Exam Accordion Focus Framework

This is the largest UI change. The spec (§3B) explicitly requires an **accordion stack pattern** instead of the current one-card-at-a-time wizard.

#### [MODIFY] [ExamWizard.tsx](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/components/exam/ExamWizard.tsx)

**Refactor from "single active card" to "accordion stack":**
- Render ALL step cards vertically in a scrollable stack
- Non-active cards show only their title string + step number, with `opacity-40`
- Clicking a card or pressing "Next Step" smoothly expands the targeted card (height animates over 350ms via `transition: max-height 350ms ease`)
- The previously active card collapses simultaneously

#### [MODIFY] [ExamStepCard.tsx](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/components/exam/ExamStepCard.tsx)

**Restructure for accordion mode:**
- When collapsed: render only the title row (step number + title text), with `opacity-40` styling
- When expanded:
  - **Upper half**: Video player with `rounded-t-2xl overflow-hidden` and ambient shadow matching the diagnostic channel color (Neon Purple for Brain exam, Pastel Rose for Breast exam)
  - **Lower half**: Instruction text block with `rounded-b-2xl bg-slate-900/40 p-5` in dark mode
  - Checklist sub-tasks and the existing timer component positioned inside this lower block

---

### Component 10 — Empathetic Terminal Advice Panels

#### [MODIFY] [breast/page.tsx](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/app/[locale]/(app)/dashboard/self-exam/breast/page.tsx)

Replace the generic completion view (`view === 'complete'`) with the spec's **Translucent Friendly Terminal Advice Panel**:

- Full-width translucent panel: `bg-primary/5 dark:bg-primary/10 backdrop-blur-sm rounded-3xl p-8`
- 🌸 emoji header
- **English text** (spec-exact): "Great job completing your monthly check today! 🌸 If everything felt completely normal and you didn't notice any lumps or changes, that is wonderful and you are all set until next month! But remember, if you ever spot or feel anything different or unusual while following the video guide, stay calm—it is simply a sign to gently reach out to your doctor..."
- **Arabic text** (spec-exact): "برافو عليكي، اكتمل فحصك الدوري اليوم! 🌸 طالما ملمس وشكل الجلد طبيعي ومفيش أي تكتلات، فـ أنتِ كدة في أمان..."
- Display the correct language version based on `locale`
- Keep the existing action buttons (AI Analysis link, Book Appointment link) below the advice text

#### [MODIFY] [skin/page.tsx](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/app/[locale]/(app)/dashboard/self-exam/skin/page.tsx)

Same pattern — replace the completion view with the Brain Examination terminal advice panel text from the spec. (The brain exam text is reusable for the skin check page since it covers the same neurological self-exam pattern.)

> [!NOTE]
> Add all new strings to `messages/ar.json` and `messages/en.json` under a new `exam.terminal` namespace.

---

### Component 11 — Children's Health Suite Visual Upgrade

#### [MODIFY] [children/page.tsx](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/app/[locale]/(app)/dashboard/children/page.tsx)

**Hero banner upgrade:**
- Add a wide glassmorphism title banner: `"Sebar's Kids Portal"` text
- Add `"Privacy First — 8 Local Offline Tools — System Secure"` badge
- Use `glass-panel` utility in dark mode

**Bento grid upgrade:**
- Apply unique pastel color scheme to each card per spec:
  1. Growth Tracker → `bg-sky-100 dark:bg-sky-900/20`
  2. BMI Calculator → `bg-emerald-100 dark:bg-emerald-900/20`
  3. Symptom Checker → `bg-rose-100 dark:bg-rose-900/20`
  4. Dev Milestones → `bg-cyan-100 dark:bg-cyan-900/20`
  5. Dosage Calculator → `bg-orange-100 dark:bg-orange-900/20`
  6. Vaccination → `bg-lime-100 dark:bg-lime-900/20`
  7. Food Guide → `bg-yellow-100 dark:bg-yellow-900/20`
  8. First Aid → `bg-red-100 dark:bg-red-900/20`

- Add elastic spring hover per spec: `hover:scale-[1.03] hover:-translate-y-3 transition-all duration-500`
- Add localized neon ambient shadow on hover matching each tool's color

#### [NEW] 3D Assets via `generate_image`

Generate 8 child-friendly 3D-style illustrations during implementation:
1. Cartoon giraffe + bar chart (Growth Tracker)
2. Smiling avocado on digital scale (BMI)
3. Friendly thermometer with smile face (Symptom Checker)
4. Glossy alphabet blocks with brain/book/medal icons (Milestones)
5. Medicine dropper + spoon (Dosage)
6. Cartoon syringe + checklist (Vaccination)
7. Floating food planets orbital (Food Guide)
8. 3D first-aid kit with pulsing heart (First Aid)

These will be saved to `public/images/children/` and embedded in each card.

### Component 12 — Global Dashboard Consistency (Admin, Doctor, Patient)

To ensure the new design aesthetics (glassmorphism, neon hover effects, and fluid animations) apply uniformly across the entire project, the following sweeping updates will be made to the portal pages:

#### [MODIFY] All Portal Dashboards
- `src/app/[locale]/(app)/admin/page.tsx`
- `src/app/[locale]/(app)/doctor/page.tsx`
- `src/app/[locale]/(app)/dashboard/page.tsx`
- `src/app/[locale]/(app)/examinations/page.tsx`

**Changes to apply:**
1. **Universal Glassmorphism:** Replace hardcoded `bg-surface-container-lowest` on all stat cards, quick action cards, and tables with a responsive class string: `bg-surface-container-lowest dark:glass-panel ambient-shadow ghost-border dark:border-white/10`. This ensures the galactic midnight glass effect applies globally.
2. **Elastic-Bounce + Neon Glow:** Update interactive elements (Quick Actions, Examination cards) to use the new spec-defined hover state: `hover:-translate-y-2 hover:scale-[1.01] hover:shadow-xl dark:hover:shadow-[0_0_30px_rgba(0,242,254,0.15)] transition-all duration-500 ease-out`.
3. **Animated Tables & Lists:** Ensure all mapped items (e.g., Today's Appointments, Patient Lists, Doctor Lists) utilize the GPU-accelerated staggered animations (`anim-left-in` or `anim-fade-up-in`) with a dynamic `transitionDelay`.

---

### Component 13 — Database Schema & Notification Preferences (CRITICAL)

> [!CAUTION]
> The `Patient` entity currently has NO fields for notification opt-in/opt-out or preferred language. Dispatching WhatsApp messages without checking user consent violates privacy best practices. This component MUST be implemented before Component 2 (WhatsApp Service) goes live.

#### [MODIFY] [Patient.cs](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.Domain/Entities/Patient.cs)

Add three new fields after the existing `BloodType` property (line 40):

```csharp
/// Notification preference flags
public bool IsAppointmentNotificationEnabled { get; set; } = true;
public bool IsCampaignNotificationEnabled { get; set; } = true;

/// Language preference for outbound messages (AR / EN)
[MaxLength(5)]
public string PreferredLanguage { get; set; } = "ar";
```

**Impact on existing components:**

- **`WhatsAppService.SendAppointmentReminderAsync`** (Component 2): Must check `patient.IsAppointmentNotificationEnabled` before dispatching. If `false`, log a skip and return early.
- **`BreastCheckCampaignScheduler`** (Component 5): Query filter must add `&& p.IsCampaignNotificationEnabled`:
  ```csharp
  context.Patients.Where(p => p.Gender == "Female"
      && p.PhoneNumber != null
      && p.IsCampaignNotificationEnabled)
  ```
- **`WhatsAppService` template language**: Replace the hardcoded `Language: "ar"` with `patient.PreferredLanguage`. The `SendBreastCheckReminderAsync` and `SendAppointmentReminderAsync` methods must accept a `language` parameter and use it to select the template variant.

#### [MODIFY] [AppDbContext.cs](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.Infrastructure/Context/AppDbContext.cs)

Add default value configuration inside `OnModelCreating`:

```csharp
modelBuilder.Entity<Patient>()
    .Property(p => p.IsAppointmentNotificationEnabled)
    .HasDefaultValue(true);

modelBuilder.Entity<Patient>()
    .Property(p => p.IsCampaignNotificationEnabled)
    .HasDefaultValue(true);

modelBuilder.Entity<Patient>()
    .Property(p => p.PreferredLanguage)
    .HasDefaultValue("ar");
```

#### EF Core Migration

After modifying the entity, generate a new migration:
```bash
dotnet ef migrations add AddPatientNotificationPreferences --project MedScanAI.Infrastructure --startup-project MedScanAI.API
dotnet ef database update --project MedScanAI.Infrastructure --startup-project MedScanAI.API
```

---

### Component 14 — Frontend-to-Backend Settings Synchronization (CRITICAL)

> [!IMPORTANT]
> The Settings page (`settings/page.tsx`) already has live UI toggle components for notifications and a language switcher. These currently persist to `localStorage` only. They must be wired to actual API endpoints that update the database fields from Component 13.

#### [NEW] [PatientPreferencesController.cs](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.API/Controllers/PatientPreferencesController.cs)

A new controller with two endpoints:

```
GET  /api/patient/preferences         → Returns { isAppointmentNotificationEnabled, isCampaignNotificationEnabled, preferredLanguage }
PUT  /api/patient/preferences         → Updates the three fields from request body
```

Both endpoints require `[Authorize(Roles = "Patient")]`. The patient ID is extracted from JWT claims.

#### [NEW] [IPatientPreferencesService.cs](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.Service/Abstracts/IPatientPreferencesService.cs)

```csharp
public interface IPatientPreferencesService
{
    Task<ReturnBase<PatientPreferencesDto>> GetPreferencesAsync(string patientId);
    Task<ReturnBase<string>> UpdatePreferencesAsync(string patientId, UpdatePreferencesDto dto);
}
```

#### [NEW] [PatientPreferencesService.cs](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.Service/Implementation/PatientPreferencesService.cs)

Reads/writes the three fields on `Patient` via `IPatientRepository`.

#### [MODIFY] [settings/page.tsx](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/app/[locale]/(app)/settings/page.tsx)

Changes:
- On mount, fetch `GET /api/patient/preferences` and seed the toggle states
- On each notification toggle change, fire `PUT /api/patient/preferences` with the updated values
- On language change, also include `preferredLanguage` in the PUT payload in addition to the existing `router.push` for locale switching

#### [NEW] [patientPreferencesService.ts](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/services/patientPreferencesService.ts)

Frontend API client wrapping the GET/PUT endpoints with the existing `apiClient` pattern.

---

### Component 15 — Comprehensive Sebar Rebranding (CRITICAL)

> [!WARNING]
> The entire project currently uses the legacy "MediScan AI" branding. The spec mandates migration to the unified **"Sebar"** brand name. This affects **22+ frontend files** across all portals.

#### Files requiring text node changes ("MediScan AI" → "Sebar"):

| # | File | What to change |
|---|------|---------------|
| 1 | [SideNavBar.tsx](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/components/layout/SideNavBar.tsx) | Brand text in sidebar header |
| 2 | [LandingNav.tsx](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/components/layout/LandingNav.tsx) | Landing navbar brand |
| 3 | [Logo.tsx](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/components/ui/Logo.tsx) | Alt text and any brand string |
| 4 | [FloatingChatWidget.tsx](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/components/ui/FloatingChatWidget.tsx) | Widget header |
| 5 | [RateExperienceModal.tsx](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/components/patient/RateExperienceModal.tsx) | Review prompt text |
| 6 | [page.tsx (landing)](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/app/[locale]/page.tsx) | Hero section, card titles |
| 7 | [page.tsx (onboarding)](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/app/[locale]/onboarding/page.tsx) | `<h1>MediScan AI</h1>` |
| 8 | [settings/page.tsx](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/app/[locale]/(app)/settings/page.tsx) | Workspace name field |
| 9 | [layout.tsx (root locale)](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/app/[locale]/layout.tsx) | `<title>` and `<meta>` tags |
| 10 | [error.tsx](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/app/[locale]/error.tsx) | Error page brand |
| 11 | [not-found.tsx](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/app/not-found.tsx) | 404 page brand |
| 12 | [doctor/profile/page.tsx](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/app/[locale]/(app)/doctor/profile/page.tsx) | Doctor profile header |
| 13 | [ai-tools/[tool]/page.tsx](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/mediscan-web/src/app/[locale]/(app)/dashboard/ai-tools/[tool]/page.tsx) | AI tool pages |
| 14-17 | Layout files: `children/layout.tsx`, `reports/layout.tsx`, `profile/layout.tsx`, `forbidden-medicines/layout.tsx` | `<title>` metadata |
| 18-21 | Auth pages: `login/page.tsx`, `register/page.tsx`, `forgot-password/page.tsx`, `reset-password/page.tsx` | Login/register brand headers |

#### i18n Updates

- `messages/ar.json`: Replace all `"MediScan AI"` → `"سبار"` (Sebar in Arabic)
- `messages/en.json`: Replace all `"MediScan AI"` → `"Sebar"`

#### Backend Branding (Optional but recommended)

- Update API Swagger title in `Program.cs` from "MedScanAI" to "Sebar API"
- Consider renaming the `appsettings.json` metadata fields if any contain the old brand name

---

### Component 16 — Secure Token Handling (CRITICAL SECURITY)

> [!CAUTION]
> The current plan hardcodes the Meta Permanent Access Token directly inside `appsettings.json`, which is **version-controlled**. This constitutes a critical security breach — Token Leakage. The token must NEVER appear in source control.

#### [MODIFY] [MedScanAI.API.csproj](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.API/MedScanAI.API.csproj)

Add `UserSecretsId` to the `<PropertyGroup>`:

```xml
<PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <UserSecretsId>sebar-api-dev-secrets</UserSecretsId>
</PropertyGroup>
```

#### [MODIFY] [appsettings.json](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.API/appsettings.json)

The `WhatsAppSettings` section should contain **only non-secret values**:

```json
"WhatsAppSettings": {
    "ApiUrl": "https://graph.facebook.com/v25.0/",
    "PhoneNumberId": "<<SET_VIA_USER_SECRETS>>",
    "AccessToken": "<<SET_VIA_USER_SECRETS>>"
}
```

#### Local Development Setup

Initialize secrets and store the real values:

```bash
dotnet user-secrets init --project MedScanAI.API
dotnet user-secrets set "WhatsAppSettings:PhoneNumberId" "1065453269974512" --project MedScanAI.API
dotnet user-secrets set "WhatsAppSettings:AccessToken" "EAF5KBhbrzbgBQ..." --project MedScanAI.API
```

> [!NOTE]
> `.NET User-Secrets` automatically override `appsettings.json` values at runtime via `builder.Configuration`. No additional code is needed — the `IConfiguration` injection in `WhatsAppService` will automatically resolve the secret values. On production/staging, these values should be set as Environment Variables on the host.

#### [MODIFY] [WhatsAppService.cs](file:///d:/University/Graduation%20Project/Final%20Folder/Notebooks/MedScanAI-master/MedScanAI.Service/Implementation/WhatsAppService.cs)

Add a startup validation check in the constructor:

```csharp
public WhatsAppService(HttpClient httpClient, IConfiguration config, ILogger<WhatsAppService> logger)
{
    _httpClient = httpClient;
    _logger = logger;
    _phoneNumberId = config["WhatsAppSettings:PhoneNumberId"]
        ?? throw new InvalidOperationException("WhatsAppSettings:PhoneNumberId is not configured. Use 'dotnet user-secrets' for local dev.");
    _accessToken = config["WhatsAppSettings:AccessToken"]
        ?? throw new InvalidOperationException("WhatsAppSettings:AccessToken is not configured. Use 'dotnet user-secrets' for local dev.");
}
```

This ensures the app fails fast at startup with a clear error message if secrets are missing, rather than silently failing at runtime when a WhatsApp message is sent.

---

## Complete Summary of All Changes

### Backend (.NET)

| Action | Layer | File | Description |
|--------|-------|------|-------------|
| MODIFY | API | `appsettings.json` | Add `WhatsAppSettings` with placeholder values only |
| MODIFY | API | `MedScanAI.API.csproj` | Add `<UserSecretsId>` for secure token storage |
| NEW | Service/Abstracts | `IWhatsAppService.cs` | Interface with 2 async methods |
| NEW | Service/Implementation | `WhatsAppService.cs` | Typed HttpClient + Meta API + error logging + secret validation + dynamic language |
| NEW | Service/Implementation | `BreastCheckCampaignScheduler.cs` | BackgroundService with consent-aware query filter |
| MODIFY | Service/Implementation | `AppointmentService.cs` | Inject IWhatsAppService, check consent before dispatching |
| MODIFY | API | `Program.cs` | Register typed HttpClient + HostedService |
| MODIFY | Domain | `Patient.cs` | Add `IsAppointmentNotificationEnabled`, `IsCampaignNotificationEnabled`, `PreferredLanguage` |
| MODIFY | Infrastructure | `AppDbContext.cs` | Configure default values for new Patient fields |
| NEW | Migration | `AddPatientNotificationPreferences` | EF Core migration for new columns |
| NEW | API/Controllers | `PatientPreferencesController.cs` | GET/PUT preferences endpoints |
| NEW | Service/Abstracts | `IPatientPreferencesService.cs` | Preferences service interface |
| NEW | Service/Implementation | `PatientPreferencesService.cs` | Preferences service implementation |

### Frontend (Next.js)

| Action | Layer | File | Description |
|--------|-------|------|-------------|
| MODIFY | CSS | `globals.css` | Dark mode tokens, neon accents, glass-panel utility, laser-shimmer keyframes |
| NEW | Component | `src/components/ui/Preloader.tsx` | Full-screen laser-scan preloader |
| MODIFY | Layout | `src/app/[locale]/layout.tsx` | Mount `<Preloader>` |
| MODIFY | Page | `src/app/[locale]/page.tsx` | Bento grid + mesh gradient hero |
| MODIFY | Page | `dashboard/ai-tools/page.tsx` | Elastic-bounce + neon glow on hover |
| MODIFY | Component | `ExamWizard.tsx` | Refactor to accordion stack pattern |
| MODIFY | Component | `ExamStepCard.tsx` | Accordion collapsed/expanded states |
| MODIFY | Page | `self-exam/breast/page.tsx` | Empathetic terminal advice panel (AR+EN) |
| MODIFY | Page | `self-exam/skin/page.tsx` | Empathetic terminal advice panel (AR+EN) |
| MODIFY | Page | `dashboard/children/page.tsx` | Pastel bento grid + hero banner + elastic springs |
| NEW | Assets | `public/images/children/*.png` | 8 generated 3D kid-friendly illustrations |
| MODIFY | Pages | `admin/page.tsx`, `doctor/page.tsx`, `dashboard/page.tsx`, `examinations/page.tsx` | Global UI consistency (Component 12) |
| MODIFY | 22+ files | All files listed in Component 15 | **Sebar rebranding** — replace all "MediScan AI" text nodes |
| MODIFY | Page | `settings/page.tsx` | Bind notification toggles + language to backend API |
| NEW | Service | `src/services/patientPreferencesService.ts` | Frontend API client for preferences |
| MODIFY | i18n | `messages/ar.json` | Add `exam.terminal` strings + Sebar brand name |
| MODIFY | i18n | `messages/en.json` | Add `exam.terminal` strings + Sebar brand name |

---

## Verification Plan (Backend)

### Automated Tests
- Build the solution with `dotnet build` to confirm zero compilation errors
- Verify DI resolves correctly at startup (the app boots without `InvalidOperationException`)
- Run the new migration — verify the three new columns exist in `Patients` table

### Manual Verification
- Book an appointment via the frontend → check server logs for WhatsApp API call result
- Check `ILogger` output for structured error logging when Meta returns non-2xx (can test with an invalid phone number)
- Verify the background scheduler starts and logs its first "next run at" timestamp
- Verify `dotnet user-secrets list` shows the WhatsApp credentials, NOT `appsettings.json`
- PUT `/api/patient/preferences` with `isCampaignNotificationEnabled: false` → confirm the scheduler skips that patient

## Verification Plan (Frontend)

### Automated Tests
- Run `next build` to confirm zero TypeScript/compilation errors
- Verify all pages generate successfully
- `grep -r "MediScan" src/` returns **zero results** after rebranding

### Manual Verification
- Toggle dark mode → confirm new galactic midnight palette and glassmorphism panels
- Navigate to landing → confirm mesh gradient hero + bento grid model cards + "Sebar" brand name
- Open AI Tools hub → hover cards → confirm elastic bounce + neon cyan shadow in dark mode
- Open breast self-exam → confirm accordion stack with expand/collapse animation
- Complete self-exam → confirm empathetic advice panel renders in correct locale
- Navigate to Children's Hub → confirm pastel bento grid, 3D assets, elastic spring hover
- Verify Admin, Doctor, and Patient dashboard cards and tables all exhibit glassmorphism and the new elastic-bounce neon hover effects in dark mode
- Open Settings → toggle a notification → confirm API call fires and value persists on refresh
- Change language in Settings → confirm `PreferredLanguage` is sent to backend
- Confirm preloader fires on first session load only
- Verify sidebar, navbar, auth pages, error pages all show "Sebar" instead of "MediScan AI"

