# Phase 8 — Examination Wizard (Sebar Parity)

## Goal

Port the Sebar Flutter **role-aware Examination Wizard** to the web. Doctors get a 5-step Brain Tumor Neurological Examination (with countdown timers); patients get a 6-step Breast Cancer Self-Examination with completion hero. Both flows share a single step engine and reuse the Phase 7 animation framework.

---

## Codebase Analysis — Key Findings

Before defining the plan, here is what the deep file audit revealed:

| Item | Status | Impact on plan |
|---|---|---|
| `src/types/` | Only `api.ts` + `auth.ts`. No `exam.ts` | Must create `exam.ts` from scratch |
| `src/components/exam/` | **Does not exist** | Entire component directory is new |
| `SideNavBar.tsx` | `NAV_ITEMS[]` with `{ key, icon, href, roles: UserRole[] }`. Keys are i18n lookup keys via `t(item.key)`. Active detection: exact match for root paths, `startsWith` for sub-paths | New nav items must follow this exact pattern. Keys must be added to `messages/*.json` under `nav.*` |
| `doctor/page.tsx` | 3 stat cards in `grid-cols-3`. No exam shortcut | Add 4th card or replace AI Tools shortcut |
| `doctor/appointments/page.tsx` | `AppointmentCard` has "View Report" + "Mark Complete". Uses `DoctorPatientEntry` with `patientId` + `patientName` | Add "Run Examination" as 3rd button |
| `dashboard/self-exam/` | **Does not exist** | New route tree |
| `messages/en.json` | Flat namespace: `nav.*`, `dashboard.doctor.*`, `aiTools.*`. Nav keys = `NAV_ITEMS[].key` | New exam keys under `exam.*` namespace + `nav.selfExam` / `nav.examination` |
| `src/lib/animations.ts` | `ANIM_CLASSES` maps only: hidden/visible, scale/scaleIn, left/leftIn, right/rightIn, fadeUp/fadeUpIn. CSS also defines `anim-fade-down-in`, `anim-blur-in`, `anim-rotate-in`, `anim-bounce-in`, `anim-ring-pulse` but these are **not in the JS map** | Must add `fadeDown/fadeDownIn`, `blurIn`, `bounceIn` to `ANIM_CLASSES` if referenced from JS |
| `src/stores/` | Only `authStore.ts` (Zustand + js-cookie) | New `examStore.ts` must follow same `create<State>` pattern |
| `public/images/` | Only 3 logo files | Exam diagram placeholders needed |
| `public/videos/` | **Does not exist** | Must create `public/videos/exam/` for step videos |

---

## 8.1 — Step Engine (Shared)

### [NEW] `src/types/exam.ts`

> [!IMPORTANT]
> The original plan embedded `title`/`titleAr`/`instruction`/`instructionAr` directly in the type. This violates the project's i18n pattern — all user-facing strings go through `next-intl` via `messages/*.json` keys. The type should store **i18n keys**, not raw strings.

```ts
export type ExamStepKind = 'instruction' | 'timer' | 'observation' | 'cognitive';

export interface ExamStep {
  id: string;
  kind: ExamStepKind;
  titleKey: string;          // i18n key → e.g. "exam.brainTumor.step1Title"
  instructionKey: string;    // i18n key → e.g. "exam.brainTumor.step1Instruction"
  diagram?: string;          // path relative to public/, e.g. "/images/exam/romberg.svg"
  videoSrc?: string;         // path relative to public/, e.g. "/videos/exam/romberg.mp4"
  timerSeconds?: number;     // only for kind === 'timer'
  observationHintKey?: string; // i18n key for the yellow callout hint
}

export type ExamStepResult = 'normal' | 'abnormal' | 'done' | 'skipped' | 'concern';

export type ExamResults = Record<string, ExamStepResult>;
```

**Changes from original plan:**
- Replaced `title` / `titleAr` / `instruction` / `instructionAr` with `titleKey` / `instructionKey` (i18n keys)
- Added `videoSrc?: string` for optional per-step video
- Added `observationHintKey` as i18n key (was `observationHint` raw string)
- Added `'concern'` to `ExamStepResult` union (needed for breast self-exam "I noticed something" flow)

---

### [NEW] `src/stores/examStore.ts`

> [!NOTE]
> The original plan mentioned "Zustand temporary store" in passing under section 8.2. It needs its own file following the existing `authStore.ts` pattern (`create<State>` from Zustand).

```ts
// Pattern mirrors src/stores/authStore.ts
import { create } from 'zustand';
import type { ExamResults } from '@/types/exam';

interface ExamState {
  patientId: string | null;
  patientName: string | null;
  results: ExamResults;
  completedAt: string | null;

  setPatient: (id: string, name: string) => void;
  setResult: (stepId: string, result: ExamStepResult) => void;
  reset: () => void;
}
```

**Rationale:** Results must survive the `run → summary` page navigation. Query strings are fragile for complex data. A Zustand store is the established project pattern and avoids hydration issues. The store is cleared via `reset()` when the summary page unmounts.

---

### [NEW] `src/components/exam/ExamWizard.tsx`

Generic wizard shell consumed by both flows:

```tsx
<ExamWizard
  steps={steps}
  titleKey="exam.brainTumor.title"   // i18n key, not raw string
  onComplete={(results) => router.push(`/${locale}/doctor/examination/summary`)}
  variant="clinical" | "self-exam"
/>
```

**Props:**

| Prop | Type | Description |
|---|---|---|
| `steps` | `ExamStep[]` | Array of step descriptors |
| `titleKey` | `string` | i18n key for the wizard title |
| `variant` | `'clinical' \| 'self-exam'` | `clinical` → Normal/Abnormal buttons; `self-exam` → Done/I noticed something |
| `onComplete` | `(results: ExamResults) => void` | Called when all steps are finished or user exits |
| `onConcern?` | `() => void` | Called when patient clicks "I noticed something" in self-exam mode |

**Internal state:**
- `activeStep: number` — current step index (0-based)
- `direction: 'forward' | 'back'` — controls slide animation direction
- Navigation: Next/Previous buttons update `activeStep` and set `direction`

**Step transition animation:**
- Forward: new step slides in from right → center (`anim-right` → `anim-right-in`)
- Back: new step slides in from left → center (`anim-left` → `anim-left-in`)
- These classes already exist in `ANIM_CLASSES` and `globals.css`

---

### [NEW] `src/components/exam/ExamStepCard.tsx`

Renders one step's complete UI:

1. **Header:** Step number badge + translated title (from `titleKey`)
2. **Video / Diagram area:**
   - If `step.videoSrc` is provided and the file exists → render `<video>` element
   - Fallback: if `step.diagram` is provided → render `<img>` or inline icon
   - If neither exists → no media area (instruction-only step)
3. **Instruction card:** Arabic-primary bilingual instruction text (from `instructionKey`)
4. **Observation callout:** If `observationHintKey` is present → yellow `bg-yellow-50 dark:bg-yellow-950/20` callout with `anim-fade-down-in` entrance
5. **Action buttons:** Variant-dependent (Normal/Abnormal or Done/Skip)

#### Video Autoplay Behavior

```tsx
// Inside ExamStepCard.tsx
const videoRef = useRef<HTMLVideoElement>(null);
const prefersReducedMotion = useRef(false);

useEffect(() => {
  prefersReducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}, []);

// Pause/play when step becomes active/inactive
useEffect(() => {
  if (!videoRef.current) return;
  if (isActive && !prefersReducedMotion.current) {
    videoRef.current.currentTime = 0;
    videoRef.current.play().catch(() => {}); // catch autoplay rejection silently
  } else {
    videoRef.current.pause();
  }
}, [isActive]);
```

**Video element attributes:**
```tsx
{step.videoSrc && (
  <video
    ref={videoRef}
    src={step.videoSrc}
    autoPlay={isActive && !prefersReducedMotion.current}
    loop
    muted           // required for autoplay in all browsers
    playsInline     // required for iOS
    poster={step.diagram}  // fallback poster frame from diagram
    className="w-full rounded-xl object-cover max-h-64"
  />
)}
```

**`prefers-reduced-motion` compliance:**
- If user has reduced motion enabled → do NOT autoplay. Show `poster` frame (the `diagram` image) instead
- The `prefersReducedMotion` check is done once on mount and cached in a ref (matches the pattern used in `useCountUp` in `animations.ts`)

**Graceful fallback order:**
1. `videoSrc` exists → render `<video>` with `poster={diagram}`
2. `videoSrc` missing, `diagram` exists → render `<img src={diagram}>`
3. Neither exists → render step icon from `kind` field (e.g., `timer` → clock icon)

---

### [NEW] `src/components/exam/ExamProgressDots.tsx`

Progress dot row at the top of the wizard:

- `n` circles, one per step
- Current step: filled `bg-primary`, pulsing `anim-scale-in`
- Completed steps: `bg-primary` + checkmark icon overlay
- Future steps: `bg-surface-container-high` outline
- Animated transition between states using existing `transition-all duration-500`
- Dots are rendered as a flex row with `gap-2`, connected by a thin track line (same pattern as the register progress bar)

---

### [NEW] `src/components/exam/ExamTimer.tsx`

Countdown timer used by Romberg (30s) and Pronator Drift (20s):

- Big circular SVG ring: `stroke-dasharray` = circumference, `stroke-dashoffset` animates from full → 0
- Easing: `cubic-bezier(0.4, 0, 0.6, 1)` for linear-ish feel
- Center number counts down in large bold text
- "Start" / "Reset" buttons below
- Auto-advances or plays completion sound on reaching 0
- Pauses on `document.visibilitychange` (tab blur) — prevents silent countdown in background
- Respects `prefers-reduced-motion`: if enabled, skip animation and show static number only

---

### [NEW] `src/components/exam/ExamSummary.tsx`

Final summary shown after `onComplete`:

- Reads results from `examStore` (not from query params)
- Renders one card per step: step title + status tag
  - Normal → `bg-primary/10 text-primary`
  - Abnormal → `bg-tertiary/10 text-tertiary`
  - Skipped → `bg-surface-container-high text-on-surface-variant` outline
  - Concern → `bg-error-container text-error`
- "Generate Report" CTA → navigates to AI tools report page
- "Save & Close" → returns to doctor/patient dashboard
- Cards use `ANIM_CLASSES.scaleIn` with `staggerDelay(i, 150)`

---

### [MODIFY] `src/lib/animations.ts`

> [!NOTE]
> The following CSS classes exist in `globals.css` but are **missing from the `ANIM_CLASSES` JS map**. They must be added for the exam components to reference them.

```diff
 export const ANIM_CLASSES = {
   hidden: 'anim-hidden',
   visible: 'anim-visible',
   scale: 'anim-scale',
   scaleIn: 'anim-scale-in',
   left: 'anim-left',
   leftIn: 'anim-left-in',
   right: 'anim-right',
   rightIn: 'anim-right-in',
   fadeUp: 'anim-fade-up',
   fadeUpIn: 'anim-fade-up-in',
+  fadeDown: 'anim-fade-down',
+  fadeDownIn: 'anim-fade-down-in',
 };
```

No new CSS keyframes are needed — `anim-fade-down` and `anim-fade-down-in` already exist in `globals.css` (lines 186–187).

---

### File Summary for Section 8.1

| Action | Path |
|---|---|
| NEW | `src/types/exam.ts` |
| NEW | `src/stores/examStore.ts` |
| NEW | `src/components/exam/ExamWizard.tsx` |
| NEW | `src/components/exam/ExamStepCard.tsx` |
| NEW | `src/components/exam/ExamProgressDots.tsx` |
| NEW | `src/components/exam/ExamTimer.tsx` |
| NEW | `src/components/exam/ExamSummary.tsx` |
| MODIFY | `src/lib/animations.ts` — add `fadeDown`/`fadeDownIn` to `ANIM_CLASSES` |
| NEW | `public/videos/exam/` — directory for `.mp4` (H.264) step videos |

---

## 8.2 — Doctor Flow: Brain Tumor Neurological Examination

### Route structure

The existing `src/app/[locale]/(app)/doctor/` directory currently contains:
```
doctor/
├── page.tsx              ← dashboard (3 stat cards + schedule + registry)
├── appointments/
│   └── page.tsx          ← appointment cards with View Report + Mark Complete
└── profile/
    └── page.tsx
```

Phase 8 adds:
```
doctor/
├── examination/
│   ├── page.tsx          ← landing screen (pre-exam info + Start CTA)
│   ├── run/
│   │   └── page.tsx      ← live wizard (ExamWizard component)
│   └── summary/
│       └── page.tsx      ← results display (ExamSummary component)
```

All three new pages are `'use client'` components inside the existing `(app)` layout group, which already wraps children in `SideNavBar` + `TopNavBar` + `PageTransition`.

---

### [NEW] `src/app/[locale]/(app)/doctor/examination/page.tsx`

Landing screen before the doctor starts the wizard.

**Data flow:**
- Reads `patientId` and `patientName` from URL search params (`useSearchParams()`)
- If params are missing, shows a fallback message: "Select a patient from your appointments to begin"
- Calls `examStore.setPatient(patientId, patientName)` to persist context for the run/summary pages

**Layout:**
- Hero card with gradient accent: "Neurological Examination" title + patient name badge
- 5-step preview list (numbered, with material icons per `kind`):
  - `timer` → `timer` icon
  - `observation` → `visibility` icon
  - `cognitive` → `psychology` icon
- "Start Examination" gradient CTA button → navigates to `/${locale}/doctor/examination/run`
- Animation: entire card uses `ANIM_CLASSES.scaleIn`, preview items stagger with `staggerDelay(i, 100)`

> [!NOTE]
> The original plan suggested a "patient picker" if `patientId` is missing. This is unnecessary — the doctor reaches this page exclusively via the "Run Examination" button on the appointments page (which pre-fills the params). A picker would require a new API call (`GET patients`) that doesn't exist. Instead, we show a "go back to appointments" prompt.

---

### [NEW] `src/app/[locale]/(app)/doctor/examination/run/page.tsx`

The live wizard page. Minimal page-level code — delegates entirely to `<ExamWizard>`.

```tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { ExamWizard } from '@/components/exam/ExamWizard';
import { useExamStore } from '@/stores/examStore';
import { BRAIN_TUMOR_STEPS } from '@/data/exam-steps'; // step definitions

export default function ExamRunPage() {
  const params = useParams();
  const locale = (params?.locale as string) ?? 'ar';
  const router = useRouter();
  const { setResult } = useExamStore();

  return (
    <ExamWizard
      steps={BRAIN_TUMOR_STEPS}
      titleKey="exam.brainTumor.title"
      variant="clinical"
      onComplete={(results) => {
        // Results already written to store via setResult per step
        router.push(`/${locale}/doctor/examination/summary`);
      }}
    />
  );
}
```

#### The 5 Steps (matching Sebar Patch 4)

| # | Step | `kind` | Timer | `id` | Video |
|---|---|---|---|---|---|
| 1 | Romberg Balance Test | `timer` | 30s | `romberg` | `/videos/exam/romberg.mp4` (optional) |
| 2 | Finger-to-Nose Test | `observation` | — | `finger-nose` | `/videos/exam/finger-nose.mp4` (optional) |
| 3 | Eye Movement Test | `observation` | — | `eye-movement` | `/videos/exam/eye-movement.mp4` (optional) |
| 4 | Pronator Drift Test | `timer` | 20s | `pronator-drift` | `/videos/exam/pronator-drift.mp4` (optional) |
| 5 | Cognitive Assessment | `cognitive` | — | `cognitive` | — |

> [!TIP]
> Step definitions should live in a dedicated data file `src/data/exam-steps.ts` (not inline in the page component) so both the landing preview and the wizard can import the same array without duplication. This is a new file not in the original plan.

**Per-step behavior in `clinical` variant:**
- **Normal / Abnormal buttons:** Write result to `examStore.setResult(step.id, 'normal' | 'abnormal')`
- **"Add Note" toggle:** Expands an inline `<textarea>` with `max-height` CSS transition (from 0 → auto). Notes are stored in examStore as a separate `notes: Record<string, string>` field (added to store interface)
- **Timer steps:** Show `<ExamTimer>` component. Timer must complete (or be manually skipped) before Normal/Abnormal buttons become active
- **Video:** Each step card renders its video via `ExamStepCard` — pauses when navigating away, restarts on return (per 8.1 spec)

---

### [NEW] `src/app/[locale]/(app)/doctor/examination/summary/page.tsx`

Post-wizard results screen.

**Data source:** Reads from `useExamStore()` — NOT from query params or `localStorage`.

**Guard:** If `examStore.results` is empty (e.g., user navigated directly to `/summary`), redirect to `/doctor/examination`.

**Layout:**
- Patient name header (from `examStore.patientName`)
- 5 result cards — one per step — using `<ExamSummary>` component (defined in 8.1)
- CTA buttons:
  - "Generate Report" → `/${locale}/dashboard/ai-tools/brain-tumor` (the existing AI tool route — passes exam context via store or query)
  - "Save & Close" → `/${locale}/doctor` and calls `examStore.reset()`

**Persistence:**
- "Save to Patient Record" writes to `localStorage` keyed as `exam_${patientId}_${Date.now()}`
- No backend endpoint exists for clinical exam results — documented as future work

**Cleanup:** `useEffect` cleanup calls `examStore.reset()` on unmount to prevent stale data on subsequent wizard runs.

---

### [NEW] `src/data/exam-steps.ts`

> [!IMPORTANT]
> This file was not in the original plan. It centralizes step definitions so the landing preview, the wizard, and the summary can all share the same source of truth.

```ts
import type { ExamStep } from '@/types/exam';

export const BRAIN_TUMOR_STEPS: ExamStep[] = [
  {
    id: 'romberg',
    kind: 'timer',
    titleKey: 'exam.brainTumor.step1Title',
    instructionKey: 'exam.brainTumor.step1Instruction',
    timerSeconds: 30,
    observationHintKey: 'exam.brainTumor.step1Hint',
    diagram: '/images/exam/romberg.svg',
    videoSrc: '/videos/exam/romberg.mp4',
  },
  // ... 4 more steps
];

export const BREAST_SELF_STEPS: ExamStep[] = [
  // ... 6 steps (defined in section 8.3)
];
```

---

### [MODIFY] `src/app/[locale]/(app)/doctor/page.tsx`

**Current state:** 3 stat cards in a `grid-cols-1 md:grid-cols-3` grid (Today's Load, Total Patients, AI Tools shortcut).

**Change:** Convert grid to `md:grid-cols-4` and add a 4th card — the Examination Wizard shortcut.

> [!WARNING]
> The original plan said "animated brain SVG with `anim-float`". There is no brain SVG asset in `public/images/`. Use a Material Symbol icon (`neurology`) with `anim-float` class instead. This avoids a missing-asset issue at build time.

```tsx
{/* New 4th card — Examination shortcut */}
<Link
  href={`/${locale}/doctor/examination`}
  className={`bg-surface-container-lowest rounded-xl p-6 ambient-shadow ghost-border
    relative overflow-hidden hover:bg-surface-container-low transition-all duration-700
    group ${mounted ? ANIM_CLASSES.scaleIn : ANIM_CLASSES.scale}`}
  style={{ transitionDelay: staggerDelay(4, 100) }}
>
  <div className="absolute top-3 end-3 opacity-10 pointer-events-none">
    <span className="material-symbols-outlined text-6xl anim-float">neurology</span>
  </div>
  <div className="w-11 h-11 rounded-full bg-tertiary/10 text-tertiary
    flex items-center justify-center mb-4 anim-glow">
    <span className="material-symbols-outlined">medical_information</span>
  </div>
  <p className="font-bold text-on-surface mb-1">Run Neurological Exam</p>
  <p className="text-xs text-on-surface-variant">5-step brain tumor screening</p>
</Link>
```

**Grid change:** Line 181 changes from `md:grid-cols-3` to `md:grid-cols-2 lg:grid-cols-4`.

---

### [MODIFY] `src/app/[locale]/(app)/doctor/appointments/page.tsx`

**Current state:** `AppointmentCard` renders two buttons: "View Report" + "Mark Complete" (lines 127–151).

**Change:** Add a third button — "Run Examination" — between "View Report" and "Mark Complete".

```tsx
{/* Run Examination — new button */}
<Link
  href={`/${locale}/doctor/examination?patientId=${entry.patientId}&patientName=${encodeURIComponent(entry.patientName)}`}
  className="flex items-center gap-1.5 px-4 py-2 rounded-full
    bg-tertiary/10 text-tertiary text-sm font-semibold
    hover:bg-tertiary/20 hover:scale-105 active:scale-95 transition-all"
>
  <span className="material-symbols-outlined text-sm">medical_information</span>
  Run Examination
</Link>
```

**Important details:**
- The button is a `<Link>` (not `<button>`) since it navigates to a new route
- Must add `import Link from 'next/link'` and `import { useParams } from 'next/navigation'` — the current file does NOT import these (it uses `useAuthStore` for userId and `useCallback`). The `locale` must be read from `useParams()`.
- `patientId` and `patientName` are already available as props on `AppointmentCard` via the `entry: DoctorPatientEntry` object
- Uses `tertiary` color to visually distinguish from the `primary` "View Report" button

---

### File Summary for Section 8.2

| Action | Path |
|---|---|
| NEW | `src/app/[locale]/(app)/doctor/examination/page.tsx` |
| NEW | `src/app/[locale]/(app)/doctor/examination/run/page.tsx` |
| NEW | `src/app/[locale]/(app)/doctor/examination/summary/page.tsx` |
| NEW | `src/data/exam-steps.ts` — shared step definitions |
| MODIFY | `src/app/[locale]/(app)/doctor/page.tsx` — add 4th stat card, change grid to 4-col |
| MODIFY | `src/app/[locale]/(app)/doctor/appointments/page.tsx` — add "Run Examination" link + imports |

---

## 8.3 — Patient Flow: Self-Examination Hub

### Critical Finding: Existing `SelfExamSection.tsx`

> [!WARNING]
> The landing page already has a fully functional self-examination component at `src/components/home/SelfExamSection.tsx` (279 lines). It contains:
> - `BRAIN_STEPS[]` — 5 steps with Arabic instructions, lucide-react icons
> - `BREAST_STEPS[]` — 6 steps with Arabic instructions, lucide-react icons
> - `BrainExamCard` — interactive stepper with progress bars, prev/next, and completion screen
> - `BreastExamCard` — same pattern, 6 steps, completion links to `/register`
>
> **This is NOT the same as the Phase 8 interactive wizard.** The landing page version is a **marketing preview** for unauthenticated visitors. The Phase 8 version is an **authenticated patient tool** with result tracking, concern routing, localStorage persistence, and video support.
>
> **However:** The Arabic instruction text and step structure in `SelfExamSection.tsx` are the source of truth for the breast self-exam content. These must be **migrated** into `src/data/exam-steps.ts` and `messages/ar.json` — NOT duplicated as a second copy.

### Route structure

The existing `src/app/[locale]/(app)/dashboard/` directory currently contains:
```
dashboard/
├── page.tsx              ← patient dashboard (quick actions, appointments, profile)
├── ai-tools/             ← AI diagnostic hub + [tool] dynamic route
├── appointments/
├── children/
├── forbidden-medicines/
├── profile/
└── reports/
```

Phase 8 adds:
```
dashboard/
├── self-exam/
│   ├── page.tsx          ← hub (choose breast or skin exam)
│   ├── breast/
│   │   └── page.tsx      ← 6-step breast self-exam wizard
│   └── skin/
│       └── page.tsx      ← 5-step ABCDE skin self-check
```

---

### [NEW] `src/app/[locale]/(app)/dashboard/self-exam/page.tsx`

Landing hub for patient self-exams. This is the authenticated patient's entry point.

**Layout:**
- Hero card: "Monthly Self-Examination" with health icon and brief description
- Two exam cards side by side in `grid-cols-1 md:grid-cols-2`:

**Card 1 — Breast Self-Exam:**
- Icon: `health_and_safety` (Material Symbols) — matches the pink theme from `SelfExamSection.tsx`
- Title: "Breast Cancer Self-Examination"
- Subtitle: "6 steps · ~3 minutes"
- Last completion date (from `localStorage` key `selfExam_breast_lastComplete`)
- CTA: "Start Examination" → `/${locale}/dashboard/self-exam/breast`
- Accent: pink (`bg-pink-50 dark:bg-pink-950/20`)

**Card 2 — Skin Self-Exam:**
- Icon: `dermatology` (Material Symbols)
- Title: "Skin Lesion ABCDE Check"
- Subtitle: "5 steps · ~2 minutes"
- Last completion date (from `localStorage` key `selfExam_skin_lastComplete`)
- CTA: "Start Examination" → `/${locale}/dashboard/self-exam/skin`
- Accent: amber (`bg-amber-50 dark:bg-amber-950/20`)

**Reminder toggle:**
- Opt-in to 30-day reminder — stores preference in `localStorage` key `selfExam_reminderEnabled`
- Visual: toggle switch with "Remind me monthly" label
- Does NOT integrate with push notifications (no service worker exists) — instead shows an in-app reminder banner on the patient dashboard if 30+ days have passed since last completion

**Animation:**
- Page wrapper: `ANIM_CLASSES.visible` on mount
- Cards: `ANIM_CLASSES.scaleIn` with `staggerDelay(i, 150)`

---

### [NEW] `src/app/[locale]/(app)/dashboard/self-exam/breast/page.tsx`

The 6-step breast cancer self-examination wizard.

Uses `<ExamWizard variant="self-exam" steps={BREAST_SELF_STEPS} />`.

#### The 6 Steps (migrated from `SelfExamSection.tsx` BREAST_STEPS)

| # | Step | `id` | Video | Source |
|---|---|---|---|---|
| 1 | Visual inspection — arms at sides | `breast-visual-sides` | `/videos/exam/breast-step1.mp4` (optional) | `SelfExamSection.tsx` line 129 |
| 2 | Visual inspection — arms on hips | `breast-visual-hips` | `/videos/exam/breast-step2.mp4` (optional) | line 134 |
| 3 | Mirror check — side to side movement | `breast-mirror-check` | `/videos/exam/breast-step3.mp4` (optional) | line 139 |
| 4 | Circular palpation | `breast-palpation` | `/videos/exam/breast-step4.mp4` (optional) | line 144 |
| 5 | Nipple discharge check | `breast-nipple-check` | `/videos/exam/breast-step5.mp4` (optional) | line 149 |
| 6 | Repeat lying down | `breast-lying-down` | `/videos/exam/breast-step6.mp4` (optional) | line 154 |

> [!IMPORTANT]
> The Arabic instruction text from `BREAST_STEPS[].desc` in `SelfExamSection.tsx` must be moved into `messages/ar.json` under `exam.breastSelf.step1Instruction` through `step6Instruction`. English translations go into `messages/en.json`. The landing page `SelfExamSection.tsx` should then also reference these i18n keys (or remain as-is since it's a marketing component for unauthenticated users — your call in implementation).

**Per-step behavior in `self-exam` variant:**
- **"Done" button:** Marks step as `done` and advances to next step
- **"I noticed something" button:** Immediately ends the flow → shows the **Concern Screen** (see below)
- **"Skip" button:** Marks step as `skipped` and advances — only shown as a subtle text link, not a primary button
- **Video:** Each step renders via `ExamStepCard` with autoplay/pause behavior per 8.1 spec

---

### Concern Screen (inline in breast/page.tsx, not a separate route)

Triggered when the patient clicks "I noticed something" at any step.

**Layout:**
- Warning-toned card (`bg-amber-50 dark:bg-amber-950/20`)
- Icon: `warning` with `anim-bounce-in`
- Title: "We recommend further evaluation"
- Body: "Based on your observation, we recommend consulting with a medical professional or using our AI diagnostic tools."
- **CTA 1:** "Try AI Breast Cancer Analysis" → `/${locale}/dashboard/ai-tools/breast-cancer` (this slug exists — confirmed in `AI_TOOLS` array)
- **CTA 2:** "Book an Appointment" → `/${locale}/dashboard/appointments?reason=Self-exam+follow-up`
- **CTA 3:** "Continue Examination" → returns to the wizard at the same step (does not lose progress)
- Does NOT save completion timestamp (exam was interrupted)
- Animation: entire card slides in with `ANIM_CLASSES.scaleIn`

---

### Completion Screen (inline in breast/page.tsx)

Shown after all 6 steps are completed without triggering concern.

**Layout:**
- Animated checkmark: `anim-bounce-in` + `anim-ring-pulse` (both classes exist in `globals.css`)
- Title: "Examination Complete"
- Subtitle: "Great job! Regular self-examination is an important part of early detection."
- Saves completion timestamp to `localStorage`:
  ```ts
  localStorage.setItem('selfExam_breast_lastComplete', new Date().toISOString());
  ```
- **CTA 1:** "Book Follow-Up" → `/${locale}/dashboard/appointments?reason=Self-exam+follow-up`
- **CTA 2:** "Try AI Diagnosis" → `/${locale}/dashboard/ai-tools/breast-cancer`
- **CTA 3:** "Back to Dashboard" → `/${locale}/dashboard`

---

### [NEW] `src/app/[locale]/(app)/dashboard/self-exam/skin/page.tsx` *(bonus)*

5-step ABCDE skin lesion self-check.

Uses `<ExamWizard variant="self-exam" steps={SKIN_SELF_STEPS} />`.

| # | Step | `id` | Description |
|---|---|---|---|
| 1 | **A**symmetry | `skin-asymmetry` | Is the mole symmetric? Draw an imaginary line through the middle |
| 2 | **B**order | `skin-border` | Are the edges irregular, ragged, or blurred? |
| 3 | **C**olor | `skin-color` | Is the color uneven? Multiple shades of brown, black, or red? |
| 4 | **D**iameter | `skin-diameter` | Is it larger than 6mm (pencil eraser)? |
| 5 | **E**volving | `skin-evolving` | Has it changed in size, shape, or color recently? |

**Same engine, same button behavior, same concern/completion screens.**

Concern CTA links to `/${locale}/dashboard/ai-tools/skin` (slug `skin` exists — confirmed in `AI_TOOLS` array).

Completion stores to `localStorage` key `selfExam_skin_lastComplete`.

---

### Step Data Migration Plan

The `src/data/exam-steps.ts` file (introduced in 8.2) will contain all three step arrays:

```ts
export const BRAIN_TUMOR_STEPS: ExamStep[] = [ /* 5 steps */ ];
export const BREAST_SELF_STEPS: ExamStep[] = [ /* 6 steps */ ];
export const SKIN_SELF_STEPS: ExamStep[] = [   /* 5 steps */ ];
```

The Arabic text currently hardcoded in `SelfExamSection.tsx` (`BRAIN_STEPS[].desc` and `BREAST_STEPS[].desc`) becomes the source for the `messages/ar.json` values. The `SelfExamSection.tsx` landing component is left as-is for now (it serves unauthenticated users) but the authenticated wizard reads from i18n keys.

---

### File Summary for Section 8.3

| Action | Path |
|---|---|
| NEW | `src/app/[locale]/(app)/dashboard/self-exam/page.tsx` — hub with 2 exam cards |
| NEW | `src/app/[locale]/(app)/dashboard/self-exam/breast/page.tsx` — 6-step wizard + concern + completion |
| NEW | `src/app/[locale]/(app)/dashboard/self-exam/skin/page.tsx` — 5-step ABCDE wizard |
| MODIFY | `src/data/exam-steps.ts` — add `BREAST_SELF_STEPS` and `SKIN_SELF_STEPS` arrays |

> [!NOTE]
> No modifications to the patient dashboard (`dashboard/page.tsx`) are planned for Phase 8. Patients reach the self-exam hub via the sidebar nav item (added in Section 8.4). A future enhancement could add a "Self-Exam" quick action card to the patient dashboard's `QUICK_ACTIONS` array.

---

## 8.4 — Navigation & i18n

### [MODIFY] `src/components/layout/SideNavBar.tsx`

**Current `NAV_ITEMS` array (lines 19–38):**

```ts
// Patient nav — 7 items
{ key: 'dashboard',      ... href: '/dashboard',               roles: ['Patient'] },
{ key: 'appointments',   ... href: '/dashboard/appointments',  roles: ['Patient'] },
{ key: 'reports',        ... href: '/dashboard/reports',       roles: ['Patient'] },
{ key: 'aiTools',        ... href: '/dashboard/ai-tools',      roles: ['Patient'] },
{ key: 'profile',        ... href: '/dashboard/profile',       roles: ['Patient'] },
{ key: 'forbiddenMeds',  ... href: '/dashboard/forbidden-medicines', roles: ['Patient'] },
{ key: 'childrenHealth', ... href: '/dashboard/children',      roles: ['Patient'] },
// Doctor nav — 4 items
{ key: 'dashboard',      ... href: '/doctor',                  roles: ['Doctor'] },
{ key: 'appointments',   ... href: '/doctor/appointments',     roles: ['Doctor'] },
{ key: 'aiTools',        ... href: '/dashboard/ai-tools',      roles: ['Doctor'] },
{ key: 'profile',        ... href: '/doctor/profile',          roles: ['Doctor'] },
```

**Phase 8 changes — exact diff:**

```diff
  // Patient nav
  { key: 'aiTools',        icon: 'psychology',       href: '/dashboard/ai-tools',             roles: ['Patient'] },
+ { key: 'selfExam',       icon: 'health_and_safety', href: '/dashboard/self-exam',            roles: ['Patient'] },
  { key: 'profile',        icon: 'person',           href: '/dashboard/profile',              roles: ['Patient'] },
  ...
  // Doctor nav
  { key: 'appointments',   icon: 'calendar_month',   href: '/doctor/appointments',            roles: ['Doctor'] },
+ { key: 'examination',    icon: 'medical_information', href: '/doctor/examination',           roles: ['Doctor'] },
  { key: 'aiTools',        icon: 'psychology',       href: '/dashboard/ai-tools',             roles: ['Doctor'] },
```

> [!NOTE]
> **Active-route detection (line 103):** The existing logic uses `pathname.startsWith(href)` for non-root paths. This means:
> - `/dashboard/self-exam/breast` will correctly highlight `selfExam` (starts with `/dashboard/self-exam`)
> - `/doctor/examination/run` will correctly highlight `examination` (starts with `/doctor/examination`)
> - No changes needed to the active-detection logic.

---

### [MODIFY] `messages/en.json`

Add the following top-level `"exam"` section and nav keys:

```json
{
  "nav": {
    "selfExam": "Self-Examination",
    "examination": "Examination"
  },
  "exam": {
    "shared": {
      "start": "Start Examination",
      "next": "Next Step",
      "previous": "Previous",
      "skip": "Skip",
      "done": "Done",
      "normal": "Normal",
      "abnormal": "Abnormal",
      "addNote": "Add Note",
      "saveClose": "Save & Close",
      "generateReport": "Generate Report",
      "stepOf": "Step {step} of {total}",
      "complete": "Examination Complete",
      "completeSubtitle": "Great job! Regular examination is an important part of early detection.",
      "bookFollowUp": "Book Follow-Up",
      "tryAiDiagnosis": "Try AI Diagnosis",
      "backToDashboard": "Back to Dashboard",
      "concern": "I noticed something",
      "concernTitle": "We recommend further evaluation",
      "concernBody": "Based on your observation, we recommend consulting with a medical professional or using our AI diagnostic tools.",
      "continueExam": "Continue Examination",
      "tryAiAnalysis": "Try AI Analysis",
      "bookAppointment": "Book an Appointment",
      "noPatientSelected": "Select a patient from your appointments to begin.",
      "goToAppointments": "Go to Appointments",
      "saveToRecord": "Save to Patient Record",
      "savedSuccessfully": "Results saved successfully",
      "lastCompleted": "Last completed: {date}",
      "remindMonthly": "Remind me monthly"
    },
    "brainTumor": {
      "title": "Neurological Examination",
      "subtitle": "5-step assessment for brain tumor screening",
      "step1Title": "Romberg Balance Test",
      "step1Instruction": "Please stand with your feet together, arms at your sides. Now close your eyes and try to stay still for 30 seconds.",
      "step1Hint": "Observe any swaying, loss of balance, or need to open eyes early.",
      "step2Title": "Finger-to-Nose Test",
      "step2Instruction": "Extend your arm fully, then touch the tip of your nose with your index finger. Repeat several times, then try with eyes closed.",
      "step2Hint": "Watch for tremor, overshoot, or inability to accurately touch the nose.",
      "step3Title": "Eye Movement Test",
      "step3Instruction": "Keep your head still. Follow my finger with your eyes only as I move it in an H-pattern.",
      "step3Hint": "Note any nystagmus, jerky movements, or inability to track smoothly.",
      "step4Title": "Pronator Drift Test",
      "step4Instruction": "Hold both arms extended in front of you, palms facing up. Close your eyes and hold for 20 seconds.",
      "step4Hint": "Observe if one arm drifts downward or rotates inward (pronates).",
      "step5Title": "Cognitive Assessment",
      "step5Instruction": "Ask the patient: How are you today? Any headaches upon waking? Can you name [a familiar person or place]?",
      "step5Hint": "Note any confusion, difficulty finding words, or inappropriate responses."
    },
    "breastSelf": {
      "title": "Breast Cancer Self-Examination",
      "subtitle": "6 steps · ~3 minutes",
      "step1Title": "Visual Inspection — Arms at Sides",
      "step1Instruction": "Stand facing a mirror with your arms raised. Notice any changes in the shape or size of both breasts.",
      "step2Title": "Arms on Hips — Press Firmly",
      "step2Instruction": "Lower your arms and press firmly on your hips. Notice any changes in shape.",
      "step3Title": "Mirror Check — Side to Side",
      "step3Instruction": "Move slowly from side to side. Look for changes in: breast shape and size, nipple shape and size, skin appearance (dimpling, puckering, redness).",
      "step4Title": "Circular Palpation",
      "step4Instruction": "Using the pads of your three middle fingers, feel both breasts and surrounding areas in circular motions, checking for any lumps or changes.",
      "step5Title": "Nipple Discharge Check",
      "step5Instruction": "Gently press each nipple to check for any abnormal discharge.",
      "step6Title": "Lying Down — Repeat Steps 4-5",
      "step6Instruction": "Lie on your back and repeat the palpation and nipple checks. This position helps spread the breast tissue."
    },
    "skinSelf": {
      "title": "Skin Lesion ABCDE Check",
      "subtitle": "5 steps · ~2 minutes",
      "step1Title": "A — Asymmetry",
      "step1Instruction": "Is the mole or lesion symmetric? Draw an imaginary line through the middle — do both halves match?",
      "step2Title": "B — Border",
      "step2Instruction": "Are the edges irregular, ragged, notched, or blurred?",
      "step3Title": "C — Color",
      "step3Instruction": "Is the color uneven? Look for multiple shades of brown, black, red, white, or blue.",
      "step4Title": "D — Diameter",
      "step4Instruction": "Is it larger than 6mm (about the size of a pencil eraser)? Melanomas are usually larger.",
      "step5Title": "E — Evolving",
      "step5Instruction": "Has it changed in size, shape, color, or developed new symptoms like itching or bleeding?"
    },
    "hub": {
      "title": "Monthly Self-Examination",
      "subtitle": "Regular self-checks help with early detection of potential health issues.",
      "breastCard": "Breast Cancer Self-Examination",
      "skinCard": "Skin Lesion ABCDE Check"
    }
  }
}
```

> [!NOTE]
> The `nav` keys shown above are **additions** to the existing `nav` object — they do not replace existing keys. Total new keys: **~90**.

---

### [MODIFY] `messages/ar.json`

Same structure, Arabic values. The breast self-exam Arabic text is migrated from `SelfExamSection.tsx` lines 129–157. The brain tumor Arabic text is migrated from `SelfExamSection.tsx` lines 9–33.

Key nav additions:
```json
{
  "nav": {
    "selfExam": "الفحص الذاتي",
    "examination": "الفحص العصبي"
  }
}
```

> [!TIP]
> All Arabic step instruction text already exists in `SelfExamSection.tsx` — copy it directly into the `ar.json` values. No translation work is needed for the breast and brain steps.

---

## 8.5 — Animation Integration

Every exam screen reuses the Phase 7 animation framework. No new CSS keyframes are needed — all animation classes already exist in `globals.css`.

### Step Transitions (`ExamWizard.tsx`)

| Direction | Initial Class | Target Class |
|---|---|---|
| Forward (next step) | `ANIM_CLASSES.right` | `ANIM_CLASSES.rightIn` |
| Backward (previous) | `ANIM_CLASSES.left` | `ANIM_CLASSES.leftIn` |

Implementation: Track `direction` state. On step change, render new step card with the initial class, then toggle to target class after a single frame (`requestAnimationFrame` or `setTimeout(0)`).

### Progress Dots (`ExamProgressDots.tsx`)

- Current dot: `ANIM_CLASSES.scaleIn` + `bg-primary` color crossfade
- Transition between states: existing `transition-all duration-500`
- No new keyframes needed

### Timer Ring (`ExamTimer.tsx`)

- SVG `<circle>` with `stroke-dasharray={circumference}` and `stroke-dashoffset` animated via inline style + CSS transition
- Easing: `cubic-bezier(0.4, 0, 0.6, 1)` — near-linear for countdown feel
- `prefers-reduced-motion`: Skip ring animation, show static number countdown only
- Ring color: `stroke: var(--md-primary)` → transitions to `var(--md-error)` in last 5 seconds

### Completion Checkmark

- Uses `anim-bounce-in` (existing `globals.css` line 180) for the checkmark icon
- `anim-ring-pulse` (existing `globals.css` line 206) for the pulsing ring effect behind checkmark
- Both already covered in `prefers-reduced-motion` block (line 224)

### Summary Cards (`ExamSummary.tsx`)

- `ANIM_CLASSES.scaleIn` with `staggerDelay(i, 150)` — matches the pattern used across all admin pages

### Observation Callout (`ExamStepCard.tsx`)

- `ANIM_CLASSES.fadeDownIn` (added to JS map in 8.1) — slides down from the instruction card

### Video Autoplay

- Per 8.1 spec: `useRef` on `<video>`, `useEffect` tied to `isActive` step index
- `prefers-reduced-motion`: Do not autoplay, show static poster frame
- Graceful fallback: video → diagram → kind-based icon

### Landing/Hub Pages

- Standard page-level `ANIM_CLASSES.visible` on mount
- Cards: `ANIM_CLASSES.scaleIn` with stagger
- Preview list items: `ANIM_CLASSES.leftIn` with `staggerDelay(i, 100)`

---

## 8.6 — File Summary (Phase 8, Consolidated)

| Action | Path | Description |
|---|---|---|
| NEW | `src/types/exam.ts` | ExamStep, ExamStepResult, ExamResults types |
| NEW | `src/stores/examStore.ts` | Zustand store for exam state + results |
| NEW | `src/data/exam-steps.ts` | BRAIN_TUMOR_STEPS, BREAST_SELF_STEPS, SKIN_SELF_STEPS arrays |
| NEW | `src/components/exam/ExamWizard.tsx` | Generic wizard shell |
| NEW | `src/components/exam/ExamStepCard.tsx` | Step UI with video autoplay |
| NEW | `src/components/exam/ExamProgressDots.tsx` | Progress indicator |
| NEW | `src/components/exam/ExamTimer.tsx` | SVG countdown timer |
| NEW | `src/components/exam/ExamSummary.tsx` | Results summary display |
| NEW | `src/app/[locale]/(app)/doctor/examination/page.tsx` | Doctor exam landing |
| NEW | `src/app/[locale]/(app)/doctor/examination/run/page.tsx` | Doctor live wizard |
| NEW | `src/app/[locale]/(app)/doctor/examination/summary/page.tsx` | Doctor results |
| NEW | `src/app/[locale]/(app)/dashboard/self-exam/page.tsx` | Patient self-exam hub |
| NEW | `src/app/[locale]/(app)/dashboard/self-exam/breast/page.tsx` | Breast self-exam wizard |
| NEW | `src/app/[locale]/(app)/dashboard/self-exam/skin/page.tsx` | Skin ABCDE wizard |
| NEW | `public/videos/exam/` | Directory for `.mp4` (H.264) step videos |
| MODIFY | `src/lib/animations.ts` | Add `fadeDown`/`fadeDownIn` to ANIM_CLASSES |
| MODIFY | `src/components/layout/SideNavBar.tsx` | Add 2 nav items |
| MODIFY | `src/app/[locale]/(app)/doctor/page.tsx` | Add exam shortcut card |
| MODIFY | `src/app/[locale]/(app)/doctor/appointments/page.tsx` | Add "Run Examination" button |
| MODIFY | `messages/en.json` | Add ~90 new i18n keys |
| MODIFY | `messages/ar.json` | Add ~90 new i18n keys |

**Total: 15 new files/directories, 6 modified files**

---

## 8.7 — Open Questions (Phase 8, Updated)

> [!IMPORTANT]
> **Q1 — Backend persistence:** No backend endpoint exists for storing clinical examination results per appointment. The plan stores results in `localStorage` keyed by `exam_${patientId}_${timestamp}` and documents this as future work. Should we add a `.NET` endpoint `POST /api/examination/Save` in a future phase?

> [!IMPORTANT]
> **Q2 — Diagrams/illustrations:** The Sebar mobile app has self-exam diagrams in its Flutter assets folder. The `public/images/` directory currently has only 3 logo files. Options:
> - **Option A (recommended):** Use Material Symbols icons as diagram placeholders during initial build. Replace with proper medical illustrations later.
> - **Option B:** Extract SVG assets from the Flutter project into `public/images/exam/`.
> - **Option C:** Generate placeholder illustrations using the `generate_image` tool.

> [!NOTE]
> **Q3 — Video files:** The plan creates `public/videos/exam/` but does not include actual `.mp4` files. The `videoSrc` field is optional on every step — the wizard will gracefully fall back to diagrams/icons if videos are absent. Video files can be added independently at any time without code changes.

> [!WARNING]
> **Q4 — SelfExamSection.tsx duplication:** The landing page's `SelfExamSection.tsx` has hardcoded Arabic step text and lucide-react icons. The authenticated wizard uses i18n keys and Material Symbols. Two options:
> - **Option A (recommended for Phase 8):** Leave `SelfExamSection.tsx` as-is. The landing page serves unauthenticated users and doesn't need store/video/result-tracking features.
> - **Option B (future cleanup):** Refactor `SelfExamSection.tsx` to also read from i18n keys and share step definitions with `exam-steps.ts`.

---

## 8.8 — Verification (Phase 8)

### Automated Checks

```bash
npm run lint    # Exit 0 — zero errors, zero warnings
npm run build   # Exit 0 — 6 new routes compile
```

### Expected New Routes

```
ƒ /[locale]/doctor/examination
ƒ /[locale]/doctor/examination/run
ƒ /[locale]/doctor/examination/summary
ƒ /[locale]/dashboard/self-exam
ƒ /[locale]/dashboard/self-exam/breast
ƒ /[locale]/dashboard/self-exam/skin
```

### Manual Browser Checks

- [ ] **Nav:** Patient sidebar shows "Self-Examination" item → highlights when on `/self-exam/*`
- [ ] **Nav:** Doctor sidebar shows "Examination" item → highlights when on `/examination/*`
- [ ] **Doctor landing:** `/doctor/examination?patientId=X&patientName=Y` shows patient name and 5-step preview
- [ ] **Doctor wizard:** Romberg timer counts 30→0, pauses on tab blur, auto-advances
- [ ] **Doctor wizard:** Pronator timer counts 20→0
- [ ] **Doctor wizard:** "Add Note" expands inline textarea with smooth transition
- [ ] **Doctor wizard:** Step transitions slide left/right directionally
- [ ] **Doctor summary:** Shows all 5 categories with correct status tags (Normal/Abnormal/Skipped)
- [ ] **Doctor summary:** "Save to Patient Record" writes to localStorage
- [ ] **Patient hub:** `/dashboard/self-exam` shows 2 exam cards with last completion dates
- [ ] **Patient breast:** 6 steps render bilingually (Arabic primary in RTL)
- [ ] **Patient breast:** "I noticed something" shows concern screen with AI tool + booking CTAs
- [ ] **Patient breast:** "Continue Examination" returns to same step without losing progress
- [ ] **Patient breast:** Completion saves timestamp to localStorage
- [ ] **Patient skin:** 5 ABCDE steps render correctly
- [ ] **Video autoplay:** If `.mp4` files exist in `public/videos/exam/`, videos autoplay muted on step entry
- [ ] **Video pause:** Navigating to a different step pauses the previous step's video
- [ ] **Video fallback:** If no video file, diagram/icon displays without broken UI
- [ ] **Reduced motion:** With `prefers-reduced-motion: reduce` enabled:
  - Step transitions are instant (no slide)
  - Videos do not autoplay (poster frame shown)
  - Timer ring is static (number only)
  - Completion checkmark appears without bounce
- [ ] **Dashboard shortcut:** Doctor dashboard shows 4th stat card "Run Neurological Exam"
- [ ] **Appointment button:** Each patient card on `/doctor/appointments` has "Run Examination" link
- [ ] **RTL:** All exam pages render correctly in Arabic (RTL layout)

