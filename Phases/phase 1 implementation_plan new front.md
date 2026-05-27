# Phase 1: Scaffolding, Design System & Auth

## Goal

Create a brand-new Next.js 14 frontend project from scratch in `d:\University\Graduation Project\Final Folder\Notebooks\mediscan-web`. Set up the full design system, authentication flow, JWT middleware, role-based routing, and all auth screens — all pixel-matched to the HTML mockups.

---

## Backend API Contract (Verified from Source Code)

All .NET endpoints follow: `POST https://localhost:7196/api/authentication/{Action}`

All responses follow `ReturnBase<T>`:
```typescript
{
  statusCode: number;  // HTTP status code
  succeeded: boolean;
  message: string;
  errors: string[];
  data: T | null;      // T = string (JWT token) for Login/RefreshToken, bool for others
}
```

### Auth Endpoints

| Action | Method | Auth | Body |
|--------|--------|------|------|
| `Login` | POST | ❌ | `{ email, password }` → returns `data: "jwt.token.here"` |
| `RegisterPatient` | POST | ❌ | `{ fullName, password, email, phoneNumber, gender, dateOfBirth }` |
| `RegisterDoctor` | POST | Admin | `{ fullName, password, email, phoneNumber, yearsOfExperience, specializationId, workDays[], startTime, endTime }` |
| `RegisterAdmin` | POST | Admin | `{ userName, email, password }` |
| `ConfirmEmail` | GET | ❌ | Query: `?UserId=...&Token=...` |
| `ResetPasswordEmail` | POST | ❌ | `{ email }` |
| `ResetPassword` | POST | ❌ | `{ email, newPassword, resetPasswordToken }` |
| `RefreshToken` | POST | ✅ | `{ accessToken }` → returns new JWT |
| `ChangePassword` | POST | ✅ | `{ userId, currentPassword, newPassword }` |

### JWT Token Claims

```
UserId              → claims['UserId']
role                → claims['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
email / fullName    → NOT in token — must fetch from profile endpoint after login
```

---

## Proposed Changes

### 1. Project Scaffolding

#### [NEW] `mediscan-web/` — Next.js 14 App Router project

Created via `npx create-next-app@latest` with:
- TypeScript strict mode
- App Router
- Tailwind CSS
- ESLint
- `src/` directory
- Import alias `@/`

Then install dependencies:
```
shadcn/ui, zustand, @tanstack/react-query, axios, 
react-hook-form, zod, @hookform/resolvers,
next-intl, jose (JWT decode), js-cookie
```

#### [NEW] Project structure
```
mediscan-web/
├── public/
│   └── images/
│       └── mediscan-logo.png          # Copied from sebar_logo.png
├── messages/
│   ├── ar.json                        # Arabic translations
│   └── en.json                        # English translations
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── layout.tsx             # Root layout with locale + providers
│   │   │   ├── page.tsx               # Landing page (redirect or marketing)
│   │   │   ├── (auth)/
│   │   │   │   ├── layout.tsx         # Auth layout (split-screen)
│   │   │   │   ├── login/page.tsx
│   │   │   │   ├── register/page.tsx
│   │   │   │   ├── forgot-password/page.tsx
│   │   │   │   ├── reset-password/page.tsx
│   │   │   │   └── confirm-email/page.tsx
│   │   │   ├── (app)/
│   │   │   │   ├── layout.tsx         # Authenticated layout (sidebar + topbar)
│   │   │   │   ├── dashboard/page.tsx # Patient dashboard (placeholder for Phase 2)
│   │   │   │   ├── doctor/page.tsx    # Doctor dashboard (placeholder for Phase 4)
│   │   │   │   └── admin/page.tsx     # Admin dashboard (placeholder for Phase 5)
│   │   │   └── onboarding/
│   │   │       └── page.tsx           # Post-registration patient onboarding
│   │   └── api/                       # (empty — we don't use route handlers)
│   ├── components/
│   │   ├── ui/                        # shadcn/ui components
│   │   ├── auth/                      # Auth form components
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   ├── ForgotPasswordForm.tsx
│   │   │   └── ResetPasswordForm.tsx
│   │   ├── layout/
│   │   │   ├── TopNavBar.tsx
│   │   │   ├── SideNavBar.tsx
│   │   │   └── AppShell.tsx
│   │   └── shared/
│   │       ├── Logo.tsx
│   │       ├── LocaleSwitcher.tsx
│   │       └── ThemeToggle.tsx
│   ├── lib/
│   │   ├── axios.ts                   # Axios instance with interceptors
│   │   ├── auth.ts                    # JWT decode, token helpers
│   │   └── validations/
│   │       └── auth.ts                # Zod schemas for auth forms
│   ├── hooks/
│   │   └── useAuth.ts                 # Auth hook (login, logout, user state)
│   ├── stores/
│   │   └── authStore.ts               # Zustand auth store
│   ├── services/
│   │   └── authService.ts             # Axios calls to /api/authentication/*
│   ├── types/
│   │   ├── api.ts                     # ReturnBase<T> and shared types
│   │   └── auth.ts                    # Auth-related types
│   └── middleware.ts                  # Route protection + locale redirect
├── tailwind.config.ts                 # Full design system tokens
├── next.config.mjs                    # next-intl plugin config
└── .env.local                         # NEXT_PUBLIC_API_BASE_URL
```

---

### 2. Design System (Tailwind Config)

#### [NEW] `tailwind.config.ts`

Full design token mapping from DESIGN.md and HTML mockups:

```typescript
colors: {
  primary:                   '#00685f',
  'primary-container':       '#008378',
  'primary-fixed':           '#89f5e7',
  'primary-fixed-dim':       '#6bd8cb',
  'on-primary':              '#ffffff',
  'on-primary-container':    '#f4fffc',
  'on-primary-fixed':        '#00201d',
  secondary:                 '#006780',
  'secondary-container':     '#76dcff',
  tertiary:                  '#b90538',
  'tertiary-container':      '#dc2c4f',
  error:                     '#ba1a1a',
  'error-container':         '#ffdad6',
  surface:                   '#f8f9fa',
  'surface-container-lowest':'#ffffff',
  'surface-container-low':   '#f3f4f5',
  'surface-container':       '#edeeef',
  'surface-container-high':  '#e7e8e9',
  'surface-dim':             '#d9dadb',
  background:                '#f8f9fa',
  'on-surface':              '#191c1d',
  'on-surface-variant':      '#3d4947',
  'outline':                 '#6d7a77',
  'outline-variant':         '#bcc9c6',
  'inverse-surface':         '#2e3132',
  'inverse-on-surface':      '#f0f1f2',
  'inverse-primary':         '#6bd8cb',
},
borderRadius: {
  DEFAULT: '1rem',
  lg:      '2rem',
  xl:      '3rem',
  full:    '9999px',
},
fontFamily: {
  headline: ['Plus Jakarta Sans', 'IBM Plex Sans Arabic', 'sans-serif'],
  display:  ['Plus Jakarta Sans', 'IBM Plex Sans Arabic', 'sans-serif'],
  body:     ['Plus Jakarta Sans', 'IBM Plex Sans Arabic', 'sans-serif'],
  label:    ['Plus Jakarta Sans', 'IBM Plex Sans Arabic', 'sans-serif'],
},
boxShadow: {
  ambient: '0 4px 24px rgba(0, 104, 95, 0.07)',
},
```

#### [NEW] `globals.css`

Custom utilities:
- `.signature-gradient` → `linear-gradient(135deg, #00685f, #006780)`
- `.ghost-border` → `1px solid rgba(188, 201, 198, 0.15)`
- Google Fonts imports for Plus Jakarta Sans + IBM Plex Sans Arabic
- Material Symbols Outlined icon font

---

### 3. Internationalization (next-intl)

#### [NEW] `messages/ar.json` + `messages/en.json`

All auth-related strings:

```json
{
  "app": { "name": "MediScan AI" },
  "auth": {
    "login": { "title": "...", "email": "...", "password": "...", ... },
    "register": { "title": "...", "fullName": "...", ... },
    "forgotPassword": { ... },
    "resetPassword": { ... }
  },
  "common": {
    "loading": "...",
    "error": "...",
    "success": "..."
  }
}
```

#### [NEW] `src/i18n.ts` + `next.config.mjs`

- Default locale: `ar` (Arabic, RTL)
- Secondary locale: `en` (English, LTR)
- `dir="rtl"` / `dir="ltr"` set automatically on `<html>`

---

### 4. Authentication Infrastructure

#### [NEW] `src/lib/axios.ts`

Axios instance:
- `baseURL`: `https://localhost:7196/api`
- Request interceptor: attach `Authorization: bearer {token}` from cookie
- Response interceptor: on 401, attempt `RefreshToken` — if fails, redirect to `/login`

#### [NEW] `src/lib/auth.ts`

JWT utilities using `jose`:
- `decodeToken(jwt)` → extracts `{ userId, role, exp }`
- `isTokenExpired(jwt)` → boolean
- Handles non-standard .NET claim keys:
  - `UserId` claim → userId
  - `http://schemas.microsoft.com/ws/2008/06/identity/claims/role` → role

#### [NEW] `src/stores/authStore.ts`

Zustand store:
```typescript
interface AuthState {
  token: string | null;
  user: { userId: string; role: 'Patient' | 'Doctor' | 'Admin' } | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  hydrate: () => void;  // Read token from cookie on mount
}
```

#### [NEW] `src/services/authService.ts`

```typescript
login(email, password): Promise<ReturnBase<string>>
registerPatient(data): Promise<ReturnBase<boolean>>
resetPasswordEmail(email): Promise<ReturnBase<boolean>>
resetPassword(email, newPassword, token): Promise<ReturnBase<boolean>>
refreshToken(accessToken): Promise<ReturnBase<string>>
changePassword(userId, currentPassword, newPassword): Promise<ReturnBase<boolean>>
```

#### [NEW] `src/middleware.ts`

Next.js middleware for:
1. **Locale redirect**: bare `/` → `/ar/` (default locale)
2. **Auth gate**: 
   - `/dashboard`, `/doctor`, `/admin`, `/onboarding` → require valid JWT cookie
   - If no token → redirect to `/login`
3. **Role-based routing**:
   - `/dashboard` → only `Patient`
   - `/doctor` → only `Doctor`
   - `/admin` → only `Admin`
   - Wrong role → redirect to correct dashboard
4. **Already-authed redirect**: `/login`, `/register` → if authed, redirect to role-appropriate dashboard

---

### 5. Auth Screens (6 screens)

All screens follow the mockup's split-screen layout: left = editorial image with gradient overlay + brand; right = form.

#### [NEW] `login/page.tsx`

Matches landing_page + registration mockup design language:
- Email + password fields (filled container style from DESIGN.md)
- "Sign In" gradient pill button
- "Forgot password?" link → `/forgot-password`
- "Don't have an account? Register" link → `/register`
- Form validation with Zod + React Hook Form
- On success: decode JWT → store in cookie + Zustand → redirect by role
- Error states: inline error message from `ReturnBase.message`
- Loading state: button spinner

#### [NEW] `register/page.tsx`

3-step onboarding (progress bar from mockup):
- **Step 1**: FullName, Email, Password, Confirm Password
- **Step 2**: PhoneNumber, Gender (chip selector from mockup), DateOfBirth
- **Step 3**: Review & Submit
- Calls `RegisterPatient` endpoint
- On success: show "Check your email for verification" screen
- Zod validation per step

#### [NEW] `forgot-password/page.tsx`

- Single email field
- Calls `ResetPasswordEmail` endpoint
- On success: "Reset link sent to your email" confirmation state

#### [NEW] `reset-password/page.tsx`

- Reads `email` and `token` from URL query params
- New password + confirm password fields
- Calls `ResetPassword` endpoint
- On success: redirect to `/login` with success toast

#### [NEW] `confirm-email/page.tsx`

- Reads `UserId` and `Token` from URL query params
- Auto-calls `ConfirmEmail` GET endpoint on mount
- Shows loading → success/error state
- On success: "Email verified! You can now sign in" with link to `/login`

#### [NEW] `onboarding/page.tsx`

Post-registration patient flow (stub for Phase 2):
- Welcome screen with logo + greeting
- "Let's set up your health profile" prompt
- "Get Started" button → redirects to `/dashboard`

---

### 6. Layout Components

#### [NEW] `TopNavBar.tsx`

Matches `patient_web_portal_dashboard.html` header:
- Logo ("MediScan AI" + logo image)
- Search bar (filled container style)
- Notifications, Help, Settings icon buttons
- User avatar (right side)
- Locale switcher toggle (AR/EN)

#### [NEW] `SideNavBar.tsx`

Matches mockup's sidebar:
- Logo + brand
- "New Consultation" gradient CTA button
- Navigation links with active state (filled bg + left border)
- Role-aware: shows different nav items per role
- Logout link at bottom

#### [NEW] `AppShell.tsx`

Composes TopNavBar + SideNavBar + main content area.
- Responsive: sidebar collapsed on mobile, hamburger menu
- `<main>` area matches `bg-surface-container-low p-8 lg:p-12`

---

### 7. Dashboard Placeholders

#### [NEW] `dashboard/page.tsx` (Patient)

Minimal placeholder matching the mockup greeting:
```
Good morning, {fullName}.
Your health sanctuary is updated and secure.
```
Card grid with "Coming in Phase 2" placeholders for AI tools, appointments, etc.

#### [NEW] `doctor/page.tsx` (Doctor)

Similar greeting placeholder: "Good Morning, Dr. {fullName}"

#### [NEW] `admin/page.tsx` (Admin)

Similar greeting placeholder.

---

## Open Questions

> [!IMPORTANT]
> **SSL Certificate**: The backend runs on `https://localhost:7196`. In development, Next.js may reject self-signed SSL. I'll configure Axios to accept it in dev mode via an env flag. Is this acceptable?

> [!IMPORTANT]
> **Token storage**: I plan to use `httpOnly`-like cookies via `js-cookie` (client-readable but with `secure` and `sameSite` flags). Since the .NET backend doesn't set cookies itself, the frontend manages JWT in a cookie named `mediscan_token`. Is this okay, or do you prefer `localStorage`?

> [!IMPORTANT]
> **Password requirements**: The mockup says "Must be at least 8 characters long and include a symbol." Should I enforce this in Zod validation, or does the backend already handle password policy enforcement?

---

## Verification Plan

### Automated Tests
```bash
# After Phase 1 completion:
cd mediscan-web
npm run build          # Must pass with 0 errors, 0 warnings
npm run lint           # Must pass with 0 errors
```

### Manual Verification
1. Start the .NET backend on port 7196
2. Start Next.js dev server
3. Verify these flows:
   - Visit `/` → redirected to `/ar/login`
   - Register a new patient → success message + "check email"
   - Login with valid credentials → redirected to `/ar/dashboard`
   - Login as Doctor → redirected to `/ar/doctor`
   - Login as Admin → redirected to `/ar/admin`
   - Visit `/dashboard` without token → redirected to `/login`
   - Visit `/admin` as Patient → redirected to `/dashboard`
   - Toggle AR/EN → layout flips RTL/LTR, all strings change
   - Forgot password flow → sends email
   - All forms show validation errors for empty/invalid fields
   - All forms show API error messages from backend
