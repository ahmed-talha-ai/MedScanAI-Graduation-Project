# Sebar AI Health Platform — Flutter Implementation Plan

## Goal

Build a **complete, runnable Flutter app** called **Sebar** (سِبَار) — a standalone mobile health platform with Clean Architecture, covering all 41 screens across 8 sections, with full dark/light theming, bilingual support (AR/EN), and pixel-perfect UI faithful to the provided Stitch designs.

> [!IMPORTANT]
> This is a **brand-new standalone project**. The existing MediScan web app will NOT be touched or modified.

---

## User Review Required

> [!WARNING]
> **Backend Connectivity:** The .NET 8 backend (`MedScanAI.API`) and the 5 Python AI microservices are already running. The Flutter app will call these APIs. Should I use the **same backend base URL** (e.g., `https://localhost:7XXX` for .NET API), or would you prefer the app to start with **mock data** and connect to the real API later?

> [!IMPORTANT]
> **Phased Delivery:** This is a massive 41-screen app. I propose building it in **8 phases**, delivering a runnable app after Phase 1 and incrementally adding features. Do you agree with this approach, or would you prefer a different grouping?

> [!IMPORTANT]
> **Localization:** The specs require Arabic (RTL, primary) and English (LTR). Should I implement full i18n with ARB files from the start, or use hardcoded Arabic strings initially and add English later?

---

## Proposed Changes

### Phase 1 — Project Scaffolding & Core Infrastructure

Set up the Flutter project skeleton with Clean Architecture structure, theming, DI, routing, and shared widgets.

#### [NEW] `sebar/` (Flutter project root)

Created via `flutter create` inside the Notebooks directory. Named `sebar`.

#### [NEW] Core Architecture Files

```
lib/
├── app/
│   ├── app.dart                    # MaterialApp with theme + GoRouter
│   ├── app_bloc_observer.dart      # Global BLoC observer
│   └── router/
│       ├── app_router.dart         # GoRouter configuration
│       └── app_routes.dart         # Route name constants
│
├── core/
│   ├── constants/
│   │   ├── api_constants.dart      # Backend base URLs
│   │   └── app_constants.dart      # App-wide constants
│   ├── di/
│   │   └── injection.dart          # GetIt + manual registration
│   ├── domain/
│   │   ├── failures/
│   │   │   └── failure.dart        # Sealed Failure hierarchy
│   │   └── usecase/
│   │       └── usecase.dart        # Base UseCase<Type, Params>
│   ├── error/
│   │   └── exceptions.dart         # ServerException, CacheException
│   ├── network/
│   │   ├── api_client.dart         # Dio instance + interceptors
│   │   └── network_info.dart       # Connectivity check
│   ├── presentation/
│   │   ├── theme/
│   │   │   ├── app_theme.dart      # lightTheme + darkTheme
│   │   │   ├── app_colors.dart     # All color tokens (light & dark)
│   │   │   └── app_text_styles.dart # Typography system
│   │   └── widgets/                # Shared reusable widgets
│   │       ├── sebar_app_bar.dart
│   │       ├── sebar_button.dart
│   │       ├── sebar_card.dart
│   │       ├── sebar_text_field.dart
│   │       ├── sebar_bottom_nav.dart
│   │       ├── sebar_tag_pill.dart
│   │       ├── sebar_loader.dart
│   │       └── sebar_error_widget.dart
│   └── utils/
│       ├── extensions/
│       └── validators/
│
├── main.dart                       # Single entry point
```

**Key decisions:**
- **Color system:** All colors from `UI_Description.md` palette (34 tokens) defined in `AppColors` with `light` and `dark` variants
- **Typography:** Plus Jakarta Sans (EN) + IBM Plex Sans Arabic (AR) loaded via `google_fonts`
- **Card style:** Pure white `#ffffff`, `borderRadius: 20`, `boxShadow: 0 4px 24px rgba(0,0,0,0.07)` — NO glassmorphism
- **Buttons:** Coral gradient `#f43f5e → #fb7185` pill buttons (`borderRadius: 100`)
- **Theme persistence:** `SharedPreferences` for dark/light mode preference

---

### Phase 2 — Onboarding & Authentication (Screens 1.1–1.5)

5 screens covering the app entry flow.

#### Feature: `features/splash/`

| Layer | Files |
|-------|-------|
| Presentation | `pages/splash_page.dart` — Sebar logo with pulse animation, teal progress bar, auto-navigate to onboarding |

#### Feature: `features/onboarding/`

| Layer | Files |
|-------|-------|
| Presentation | `pages/onboarding_page.dart` — 4-slide carousel (Welcome, About Us, AI Features, Ratings), dot indicators, skip button |

#### Feature: `features/auth/`

| Layer | Files |
|-------|-------|
| Domain | `entities/user.dart`, `repositories/auth_repository.dart`, `usecases/sign_in_use_case.dart`, `usecases/sign_up_use_case.dart`, `usecases/forgot_password_use_case.dart` |
| Data | `models/user_model.dart`, `datasources/auth_remote_data_source.dart`, `datasources/auth_local_data_source.dart`, `repositories/auth_repository_impl.dart`, `mappers/user_mapper.dart` |
| Presentation | `bloc/auth/auth_cubit.dart` (global session), `bloc/sign_in/sign_in_bloc.dart`, `bloc/sign_up/sign_up_bloc.dart`, `pages/sign_in_page.dart`, `pages/sign_up_page.dart`, `pages/forgot_password_page.dart`, `widgets/` (fields, social login buttons) |

**UI Notes from Stitch:**
- Login/Signup have dark navy background with the brand logo
- Coral gradient login button, social login row (Google/Apple)
- Password field with eye toggle
- Gender selector toggle, DOB picker on signup

---

### Phase 3 — Patient Core Screens (Screens 2.1–2.4, 2.9–2.12)

The main patient experience: dashboard, appointments, AI hub, profile, and medical reports.

#### Feature: `features/dashboard/`

| Layer | Files |
|-------|-------|
| Presentation | `pages/patient_dashboard_page.dart` — Greeting header, quick action cards (3), medical summary (personal + medical info cards), medical reports list, bottom nav bar |

#### Feature: `features/appointments/`

| Layer | Files |
|-------|-------|
| Domain | `entities/appointment.dart`, `repositories/appointment_repository.dart`, `usecases/get_appointments_use_case.dart`, `usecases/book_appointment_use_case.dart`, `usecases/cancel_appointment_use_case.dart` |
| Data | `models/`, `datasources/`, `repositories/appointment_repository_impl.dart` |
| Presentation | `pages/my_appointments_page.dart` (tabs: Upcoming/Past), `pages/book_appointment_page.dart` (4-step wizard), `bloc/` |

#### Feature: `features/ai_hub/`

| Layer | Files |
|-------|-------|
| Presentation | `pages/ai_models_hub_page.dart` — Featured chatbot card + 6 model cards with accuracy badges |

#### Feature: `features/profile/`

| Layer | Files |
|-------|-------|
| Domain | `entities/medical_info.dart`, `repositories/profile_repository.dart`, `usecases/update_profile_use_case.dart`, `usecases/add_medical_info_use_case.dart` |
| Data | Full data layer |
| Presentation | `pages/profile_page.dart`, `pages/update_profile_page.dart`, `widgets/add_medical_info_modal.dart` (bottom sheet with 3 tabs), `bloc/` |

#### Feature: `features/medical_report/`

| Layer | Files |
|-------|-------|
| Presentation | `pages/medical_report_viewer_page.dart` — Full report view with Case Summary, Findings, Recommendations, Drug Warnings, Next Steps, PDF download, share |

#### Feature: `features/forbidden_medicines/`

| Layer | Files |
|-------|-------|
| Presentation | `pages/nam_report_page.dart` — Patient context bar, generate report button, 3 color-coded expandable sections (Forbidden/Caution/Interactions) |

---

### Phase 4 — AI Diagnostic Models (Screens 2.5–2.8c)

#### Feature: `features/chatbot/`

| Layer | Files |
|-------|-------|
| Domain | `entities/chat_message.dart`, `repositories/chat_repository.dart`, `usecases/send_message_use_case.dart` |
| Data | `datasources/chat_remote_data_source.dart` (SSE/WebSocket streaming), `repositories/chat_repository_impl.dart` |
| Presentation | `pages/chatbot_page.dart` — Agent capabilities bar, streaming chat with blinking cursor, semantic cache badge, web search badge, stop button, voice input. `bloc/chat_bloc.dart` |

#### Feature: `features/ai_analysis/`

Shared analysis page template used by all 5 models:

| Layer | Files |
|-------|-------|
| Domain | `entities/analysis_result.dart`, `repositories/analysis_repository.dart`, `usecases/analyze_image_use_case.dart` |
| Data | Model-specific data sources calling ports 8000–8006 |
| Presentation | `pages/brain_tumor_page.dart`, `pages/xray_page.dart`, `pages/skin_disease_page.dart`, `pages/breast_cancer_page.dart`, `pages/lab_report_ocr_page.dart`, `widgets/image_upload_widget.dart`, `widgets/analysis_result_card.dart`, `widgets/confidence_bar.dart` |

---

### Phase 5 — Examination Wizards (Screens 3.1–3.2)

#### Feature: `features/examination/`

| Layer | Files |
|-------|-------|
| Presentation | `pages/brain_tumor_exam_page.dart` (5-step wizard with timers), `pages/breast_cancer_exam_page.dart` (6-step wizard, female only), `pages/exam_completion_page.dart`, `widgets/exam_step_indicator.dart`, `widgets/timer_widget.dart` |
| Domain | `usecases/save_exam_result_use_case.dart` |

---

### Phase 6 — Children's Health Section (Screens 4.1–4.9)

#### Feature: `features/children/`

| Layer | Files |
|-------|-------|
| Presentation | 9 pages: `children_hub_page.dart`, `growth_tracker_page.dart`, `milestones_page.dart`, `dosage_calculator_page.dart`, `vaccination_tracker_page.dart`, `symptom_checker_page.dart`, `food_guide_page.dart`, `bmi_calculator_page.dart`, `first_aid_page.dart` |
| Domain | Entities and use cases for growth data, vaccination schedules, dosage calculations |

---

### Phase 7 — Doctor & Admin Screens (Screens 5.1–5.3, 6.1–6.6)

#### Feature: `features/doctor/`

| Layer | Files |
|-------|-------|
| Presentation | `pages/doctor_dashboard_page.dart`, `pages/patient_details_page.dart`, `pages/doctor_report_page.dart` |
| Domain + Data | Full layers for doctor-specific operations |

#### Feature: `features/admin/`

| Layer | Files |
|-------|-------|
| Presentation | `pages/admin_dashboard_page.dart`, `pages/all_doctors_page.dart`, `pages/active_doctors_page.dart`, `pages/add_doctor_page.dart`, `pages/add_admin_page.dart`, `pages/walk_in_booking_page.dart` |
| Domain + Data | Full layers for admin operations |

---

### Phase 8 — Notifications, Settings & Polish (Screens 7.1, 8.1)

#### Feature: `features/notifications/`

| Layer | Files |
|-------|-------|
| Presentation | `pages/notifications_page.dart` — Timeline of all alerts (exams, vaccinations, appointments, reports, drug warnings) |

#### Feature: `features/settings/`

| Layer | Files |
|-------|-------|
| Presentation | `pages/settings_page.dart` — Language toggle, dark/light mode toggle, notification prefs, change password, privacy policy, about, logout |
| Domain | `usecases/update_settings_use_case.dart` |

---

## Design System Summary

### Color Palette (from UI_Description.md)

| Token | Light | Dark |
|-------|-------|------|
| Primary | `#0d9488` | `#6bd8cb` |
| Primary Surface | `#f0fdfa` | `#134e4a` |
| CTA / Coral | `#f43f5e` | `#fb7185` |
| Background | `#f9fafb` | `#0f172a` |
| Card Surface | `#ffffff` | `#1e293b` |
| Text Primary | `#111827` | `#f1f5f9` |
| Text Secondary | `#6b7280` | `#94a3b8` |
| Success | `#10b981` | `#34d399` |
| Warning | `#f59e0b` | `#fbbf24` |
| Danger | `#f43f5e` | `#fb7185` |
| Info | `#0ea5e9` | `#38bdf8` |

### Typography

| Element | Font | Weight | Size |
|---------|------|--------|------|
| Screen Title | Plus Jakarta Sans / IBM Plex Sans Arabic | ExtraBold 800 | 26px |
| Section Heading | Same | Bold 700 | 20px |
| Card Title | Same | SemiBold 600 | 16px |
| Body | Same | Regular 400 | 15px |
| Caption | Same | Regular 400 | 12px |
| Button | Same | Bold 700 | 15px |

### Spacing & Shape

- Card radius: `20px`, Input radius: `12px`, Pill buttons: `100px`
- Card padding: `20px`, Screen padding: `20px`, Section gap: `24px`  
- Card shadow: `0 4px 24px rgba(0,0,0,0.07)`

### Status Tag Pills

| Type | Background | Text |
|------|-----------|------|
| Disease | `#fee2e2` | `#991b1b` |
| Allergy | `#fef3c7` | `#92400e` |
| Medicine | `#dbeafe` | `#1e40af` |
| Confirmed | `#dcfce7` | `#166534` |
| Pending | `#fef9c3` | `#854d0e` |
| AI Accuracy | `#f0fdfa` | `#0d9488` |

---

## Key Packages

```yaml
dependencies:
  flutter_bloc, bloc               # State management
  get_it                           # DI (manual, no code gen for simplicity)
  go_router                        # Navigation
  dio                              # HTTP client
  shared_preferences               # Theme + local prefs
  flutter_secure_storage           # Token storage
  google_fonts                     # Plus Jakarta Sans + IBM Plex Sans Arabic
  fpdart                           # Either type for use cases
  equatable                        # Value equality
  image_picker                     # Camera/gallery for AI uploads
  phosphor_flutter                 # Icon library
  shimmer                          # Skeleton loading
  fl_chart                         # Growth tracker charts
  smooth_page_indicator            # Onboarding dots
  cached_network_image             # Image caching
  intl                             # Date formatting + i18n
```

---

## Assets Integration

- **Logo:** Copy `D:\...\UI\Sebar_logo.png` → `sebar/assets/images/sebar_logo.png`
- **Referenced in:** Splash screen, onboarding, app bar, login page, settings

---

## Open Questions

> [!IMPORTANT]
> 1. **Backend or Mock?** Should Phase 1 connect to the real .NET API, or start with mock repositories?
> 2. **Language priority:** Arabic-first with hardcoded strings, or full ARB i18n from day one?
> 3. **Phase execution:** Should I build and deliver Phase 1–2 first (runnable splash → login flow), then continue?

---

## Verification Plan

### Automated Tests
- Run `flutter analyze` after each phase to ensure zero warnings
- Run `flutter build apk --debug` to verify compilation
- Run `flutter test` for unit tests on domain/data layers

### Manual Verification
- Launch on Android emulator after each phase
- Visual comparison against Stitch screen.png screenshots
- Test dark/light theme toggle
- Test RTL layout
