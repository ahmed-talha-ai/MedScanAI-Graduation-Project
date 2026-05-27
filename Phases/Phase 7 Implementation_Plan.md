# Phase 7 — Full Website Animation System & UI Polish

## Goal

Phase 6 introduced a **baseline** zero-dependency animation framework (`useInView` + CSS classes + `staggerDelay`). Phase 7 takes that baseline and applies it **systematically** to every page, every component, every state transition — so the platform feels as fluid as the Flutter app's hero/SliverAppBar transitions.

<aside>
⚡

**Constraint preserved:** Still zero animation libraries (no Framer Motion, no GSAP). Pure IntersectionObserver + CSS transitions + CSS keyframes. `prefers-reduced-motion` fully respected. 

**New constraint added:** Strict 60fps performance budget. We will force hardware acceleration on animated elements and prevent React render thrashing during animations.

</aside>

## 7.1 — Animation framework expansion

### [MODIFY] `src/lib/animations.ts`

Expand the existing helpers with robust cleanup and performance optimizations:

- `useInView({ threshold, rootMargin, triggerOnce })` — already exists, add `triggerOnce` option. Ensure `IntersectionObserver` is disconnected on unmount to prevent memory leaks.
- **NEW** `useCountUp(target, duration, startOnInView?)` — animated number counter with easing. **Must mutate a `ref.current.textContent` directly** using `requestAnimationFrame` to avoid React re-render thrashing at 60fps.
- **NEW** `useStaggeredReveal(itemCount, baseDelay)` — returns array of delays for child elements.
- **NEW** `useTypewriter(text, speed)` — character-by-character text reveal.
- **NEW** `usePageTransition()` — wraps route changes with fade-out/fade-in.
- `staggerDelay(index, base=100)` — extend with `cap` parameter to prevent runaway delays past 12 items.

### [MODIFY] `src/app/globals.css`

Add new animation utility classes on top of the Phase 6 set. *Crucially, we use `translate3d` and `will-change` to offload animations to the GPU and prevent layout thrashing.*

```css
/* Existing (Phase 6): anim-hidden, anim-visible, anim-scale, anim-left, anim-right */

/* NEW — Phase 7 additions (GPU Accelerated) */
.anim-fade-down       { opacity: 0; transform: translate3d(0, -32px, 0); will-change: opacity, transform; }
.anim-fade-down-in    { opacity: 1; transform: translate3d(0, 0, 0); transition: opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1), transform 0.6s cubic-bezier(0.22, 1, 0.36, 1); }

.anim-blur            { opacity: 0; filter: blur(8px); will-change: opacity, filter; }
.anim-blur-in         { opacity: 1; filter: blur(0); transition: opacity 0.7s ease-out, filter 0.7s ease-out; }

.anim-rotate          { opacity: 0; transform: rotate(-8deg) scale(0.95) translateZ(0); will-change: opacity, transform; }
.anim-rotate-in       { opacity: 1; transform: rotate(0) scale(1) translateZ(0); transition: 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }

/* Page-level transitions */
.page-enter           { animation: pageEnter 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; will-change: opacity, transform; }
@keyframes pageEnter  { from { opacity: 0; transform: translate3d(0, 12px, 0); } to { opacity: 1; transform: translate3d(0, 0, 0); } }

/* Persistent ambient animations */
@keyframes float-slow      { 0%, 100% { transform: translate3d(0, 0, 0); } 50% { transform: translate3d(0, -6px, 0); } }
@keyframes glow-pulse      { 0%, 100% { box-shadow: 0 0 0 0 rgba(0,104,95,0.0); } 50% { box-shadow: 0 0 24px 4px rgba(0,104,95,0.25); } }
@keyframes gradient-shift  { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
@keyframes ring-pulse      { 0% { box-shadow: 0 0 0 0 rgba(0,104,95,0.6); } 100% { box-shadow: 0 0 0 16px rgba(0,104,95,0); } }
@keyframes draw-line       { from { stroke-dashoffset: 1000; } to { stroke-dashoffset: 0; } }
@keyframes count-up        { from { opacity: 0; transform: translate3d(0, 8px, 0); } to { opacity: 1; transform: translate3d(0, 0, 0); } }

.anim-float           { animation: float-slow 3.5s ease-in-out infinite; will-change: transform; }
.anim-glow            { animation: glow-pulse 2.5s ease-in-out infinite; will-change: box-shadow; }
.anim-gradient-shift  { background-size: 200% 200%; animation: gradient-shift 8s ease infinite; }
.anim-ring-pulse      { animation: ring-pulse 2s ease-out infinite; will-change: box-shadow; }
.anim-draw            { stroke-dasharray: 1000; animation: draw-line 1.5s ease-out forwards; }
```

### [NEW] `src/components/ui/AnimatedNumber.tsx`

Reusable counter component used by every dashboard stat card:

```tsx
<AnimatedNumber value={42} duration={1200} format="number" />
<AnimatedNumber value={99.39} duration={1500} format="percent" decimals={2} />
```

- Uses `useCountUp` + `useInView` so the animation only fires when the element scrolls into view.
- Eases with `cubic-bezier(0.22, 1, 0.36, 1)` for a deceleration feel.
- **Performance:** Avoids React state. Updates DOM node text content directly via `ref`.
- Falls back to the final value instantly if `prefers-reduced-motion: reduce`.

### [NEW] `src/components/ui/RevealOnScroll.tsx`

Wrapper that applies the right reveal class based on a `direction` prop:

```tsx
<RevealOnScroll direction="up" delay={120}>
	<Card>...</Card>
</RevealOnScroll>
```

Handles `up | down | left | right | scale | rotate | blur` directions and converts the existing manual `useInView + className` pattern into a single declarative call. Includes early cleanup if the component unmounts before intersecting.

### [NEW] `src/components/ui/AnimatedProgressBar.tsx`

Progress / accuracy bar that animates on view-entry, with optional gradient and label. Used for AI accuracy widgets, usage statistics, and skill bars.
*Note: Uses `transform: scaleX(target)` with `transform-origin: left` instead of animating `width`, avoiding layout repaints entirely.*

### [NEW] `src/components/ui/Typewriter.tsx`

Character-by-character text reveal for hero headlines and AI loading messages ("AI is analyzing…"). Includes accessibility properties (`aria-label`) so screen readers read the full text instantly instead of hearing letters individually.

## 7.2 — Per-page animation pass

Every one of the 26 routes gets a documented animation script. Every animation is **scroll-triggered or mount-triggered** — never auto-loops more than 2 elements simultaneously to keep CPU usage low.

### Auth pages (`/login`, `/register`, `/forgot-password`, `/reset-password`, `/confirm-email`, `/onboarding`)

| Element                                  | Animation                                                               |
| ---------------------------------------- | ----------------------------------------------------------------------- |
| :---                                     | :---                                                                    |
| Split-screen left panel (gradient image) | `anim-blur-in` on mount + ambient `anim-gradient-shift`             |
| Logo above form                          | `anim-rotate-in`, 0ms delay                                           |
| Form card container                      | `anim-scale-in`, 150ms delay                                          |
| Form fields                              | Stagger left-in, 60ms each                                              |
| Submit button                            | `anim-fade-down-in` after fields finish + `anim-glow` while hovered |
| Locale toggle                            | `anim-fade-down-in`                                                   |
| Confirm-email success checkmark          | `bounce-in`  • `anim-ring-pulse` once                              |
| Register 3-step progress bar             | Animated scaleX transition between steps + step dot scale on activate   |

### Patient dashboard (`/dashboard`)

| Element                        | Animation                                                         |
| ------------------------------ | ----------------------------------------------------------------- |
| :---                           | :---                                                              |
| "Good morning, {name}" heading | `Typewriter` reveal at 25ms/char                                |
| Tagline subtitle               | `anim-fade-up`, 300ms delay                                     |
| 3 stat cards                   | `anim-scale-in` stagger 100ms; numbers via `AnimatedNumber`   |
| Upcoming appointments list     | `anim-left-in` stagger 80ms per row                             |
| Quick action grid (4 cards)    | `anim-scale-in` stagger 120ms                                   |
| Status badges                  | Color fade-in on mount                                            |
| Hover on any card              | `translateY(-6px)`  • deeper shadow + border tint at 0.3s ease |

### AI Diagnostic Hub (`/dashboard/ai-tools`)

| Element             | Animation                                            |
| ------------------- | ---------------------------------------------------- |
| :---                | :---                                                 |
| Bento header        | `anim-fade-down-in`                                |
| 7 model cards       | `anim-scale-in` stagger 100ms (cap at 700ms total) |
| Model card icon     | Idle `anim-float` continuous; hover scales to 1.15 |
| Accuracy widgets    | `AnimatedProgressBar` fills on view-entry          |
| Hover on model card | Border glow ring + icon rotate 5deg                  |

### AI Tool wizard (`/dashboard/ai-tools/[tool]`)

Three-step crossfade flow:

- **Upload step** — drag-drop zone uses `anim-scale-in` on mount; dashed border has subtle `dash-move` ambient animation.
- **Processing step** — circular progress ring `anim-draw` SVG path + `Typewriter` for "AI is analyzing…" + ambient `anim-ring-pulse` halo.
- **Results step** — confidence ring uses `AnimatedProgressBar` (radial), classification label `anim-blur-in`, advice paragraph `anim-fade-up` (200ms delay), "Generate Report" button `anim-glow`.
- **Step transitions** — opacity crossfade 0.4s + slight Y-translate (12px) so steps don't feel like hard cuts. Use `position: absolute` during exit to avoid document flow shifts.

### Chatbot (`/dashboard/ai-tools/chatbot`)

| Element          | Animation                                                                                    |
| ---------------- | -------------------------------------------------------------------------------------------- |
| :---             | :---                                                                                         |
| Message bubbles  | New messages slide in from bottom with bounce easing (`cubic-bezier(0.34, 1.56, 0.64, 1)`) |
| Typing indicator | 3-dot bounce loop                                                                            |
| Capability chips | Stagger fade-in on mount                                                                     |
| Suggestion chips | Hover lift + accent glow                                                                     |
| Send button      | Press scale 0.95 + ripple                                                                    |

### Appointments (`/dashboard/appointments`)

- Tab switch: underline slides between tabs (CSS `transform: translateX`, avoid animating left/right).
- Appointment cards: `anim-left-in` stagger 80ms.
- Cancel action: card collapses using a `grid-template-rows: 1fr -> 0fr` transition trick + fade-out 0.4s.
- Booking modal: backdrop fade-in + modal `anim-scale-in`; wizard steps crossfade like AI tool.

### Patient Profile (`/dashboard/profile`)

- 3 history columns (Diseases / Allergies / Medications) reveal as `anim-left-in`, `anim-fade-up`, `anim-right-in` simultaneously.
- Pills: stagger fade-in 40ms.
- Add new pill: scale-in from 0 with bounce.
- Delete pill: fade + scale to 0.
- Edit profile inline: form fields slide in; cancel collapses.

### Reports (`/dashboard/reports`)

- "Generate Report" CTA: `anim-glow` ambient until clicked.
- Loading state: rotating gradient ring + `Typewriter` AI message.
- Result markdown: paragraphs reveal one-by-one with `anim-fade-up`, 80ms stagger.
- PDF button: slide-in from right after text loads.

### Forbidden Medicines (`/dashboard/forbidden-medicines`)

- Severity-coded cards (red/amber/blue): `anim-scale-in` stagger 120ms.
- Severity badge: `anim-ring-pulse` for `high` only.
- Offline fallback notice: `anim-fade-down-in` from top.

### Children's Health hub (`/dashboard/children`)

- 9 tool cards: `anim-scale-in` stagger 100ms.
- Each card icon: idle `anim-float` continuous (different phase per card so they don't all bob in sync).
- Hover: scale 1.05 + accent border glow.

### Children's Health tools (`/dashboard/children/[tool]`)

- BMI calculator: result number `AnimatedNumber`; gauge needle rotates with eased transition.
- Symptom checker: severity result card `anim-scale-in` + color crossfade.
- Growth tracker: chart line `anim-draw` (SVG stroke-dashoffset).
- Vaccination tracker: completed vaccines stamp-in with rotation; circular progress fills with `AnimatedProgressBar`.
- Milestones: checkbox tick has draw-on animation.
- Dosage calculator: weight stepper press effects + result fade.
- Food guide: category banner crossfade on age-group change.
- First aid: expandable cards use `max-height` transition + chevron rotate.

### Doctor dashboard (`/doctor`)

- Greeting: `Typewriter` for doctor name only (so it feels personal).
- 3 stat mini-cards: `anim-scale-in` stagger 100ms; counts via `AnimatedNumber`.
- Today's schedule list: `anim-left-in` stagger 80ms.
- Patient registry: `anim-right-in` stagger 80ms (so the two columns animate inward toward each other).
- Examination wizard shortcut card: `anim-glow` ambient.

### Doctor appointments (`/doctor/appointments`)

- Filter tabs: underline slide.
- Cards: `anim-left-in` stagger 80ms.
- Mark Complete: card flips on Y axis 180deg → reveals checkmark + collapses after 600ms.
- View Report: triggers ReportDrawer.

### ReportDrawer (Doctor)

- Backdrop fade-in 0.3s.
- Drawer slides in from right (`translate3d(100%, 0, 0) → 0`) with cubic-bezier easing.
- Inside: skeleton shimmer → markdown paragraphs `anim-fade-up` stagger 80ms.
- Close: reverse animation.
- Only one drawer open at a time (Phase 4 rule preserved).

### Admin dashboard (`/admin`)

- 4 stat cards: `anim-scale-in` stagger 100ms; all 4 counts via `AnimatedNumber`.
- Quick actions grid: `anim-fade-up` stagger 120ms.
- Today's appointments table: rows `anim-left-in` stagger 60ms (cap at 600ms).
- Confirm/Cancel buttons: hover glow.

### Admin doctors (`/admin/doctors`)

- Doctor cards grid: `anim-scale-in` stagger 100ms.
- Filter tabs (All/Active/Inactive): underline slide.
- Status toggle: deactivate fades card to grayscale 60% over 0.4s; restore reverses.

### Admin add-doctor / add-admin / book-appointment

- Form card: `anim-scale-in` on mount.
- Fields: stagger left-in 60ms.
- Day-of-week chip selector: chips scale on toggle.
- Submit success: button morphs into checkmark (border-radius animation) + page fades to redirect.

### Landing page (`/[locale]`)

- Word-by-word headline reveal (already done) — extend to subtitle.
- AI model cards: animate the **accuracy bars** with `AnimatedProgressBar`, animate the **architecture pill** with delayed fade.
- Self-exam guide cards: completion checkmark already bounces — add `anim-ring-pulse` to it.
- Sticky navbar: shrink on scroll (height transition + backdrop blur intensify).
- Footer: links stagger fade-in.

### 404 (`/not-found`) and Error boundary (`/[locale]/error`)

- "404" digits each `anim-rotate-in` with 100ms stagger.
- Tagline `anim-fade-up`.
- Retry button `anim-glow`.

### Loading boundaries (`(app)/loading.tsx`, `(auth)/loading.tsx`)

- Skeleton shimmer (already in Phase 6) — extend to all skeleton variants.
- Add a centered branded spinner option: rotating gradient ring with logo in middle.

## 7.3 — Layout-level animations

### `TopNavBar.tsx`

- Mount: slide-down from `-100%` to `0` (using `translate3d(0, -100%, 0)`).
- Notification bell: badge count `AnimatedNumber`; bell shake animation when new notification arrives (CSS keyframe `wiggle`).
- User avatar dropdown: scale-in from top-right origin (`transform-origin: top right`).
- Locale switcher: AR↔EN swap with 180deg flip.

### `SideNavBar.tsx`

- Mount: slide-in from `-100%` to `0`.
- Active item indicator: a vertical primary-colored bar that **slides** between active items (single shared element, not per-item) — uses `transform: translate3d` with eased transition.
- Hover on nav item: subtle background tint fade-in 0.2s.
- Logout button (bottom): always visible, `anim-fade-up` on mount.
- Mobile collapse: drawer slides in from start side; hamburger icon morphs to X.

### `AppShell.tsx` page transitions

- Wrap `{children}` in a keyed div: `<div key={pathname} className="page-enter">{children}</div>`.
- This re-mounts on route change, triggering the `pageEnter` keyframe (fade + 12px translateY).
- Sidebar and topbar are **outside** the keyed div, so they don't re-animate.

## 7.4 — Hover & micro-interaction system

All interactive elements get a consistent micro-interaction vocabulary:

| Element                   | Hover effect                                                        |
| ------------------------- | ------------------------------------------------------------------- |
| :---                      | :---                                                                |
| Cards                     | `translateY(-6px)`  • shadow ambient → md + border tint primary |
| Card icons                | scale 1.1 + 5deg rotate                                             |
| Primary buttons           | brightness 1.05 +`anim-glow` ring                                 |
| Secondary/outline buttons | background tint fade-in                                             |
| Nav links                 | slide-in underline left→right                                      |
| Table rows                | background tint primary/5                                           |
| Pills/chips               | scale 1.05 + accent border                                          |
| Arrow icons (in CTAs)     | translateX 4px                                                      |
| Avatar                    | ring fade-in primary/30                                             |

All transitions: `0.3s cubic-bezier(0.22, 1, 0.36, 1)`.

## 7.5 — Performance & GPU Acceleration

To ensure zero jank and maintain 60fps across low-end mobile devices:
1. **Animate Compositor Properties Only:** Limit animations to `transform` and `opacity`. Animating properties like `width`, `height`, `margin`, or `padding` forces a layout repaint and must be avoided (except where explicitly detailed via `grid-template-rows` hacks).
2. **GPU Offloading:** All CSS transitions affecting position use `translate3d(x, y, z)` instead of `translate()`. This forces the browser to create a separate composite layer.
3. **`will-change` utilization:** Applied strategically in `.anim-*` classes to prep the browser, but removed when animations conclude if needed to free VRAM.
4. **React Render Optimization:** Animations over time (like `AnimatedNumber` or `Typewriter`) bypass React state (`useState`) entirely and manipulate the DOM directly via `ref` and `requestAnimationFrame`.

## 7.6 — Reduced motion and accessibility

```css
@media (prefers-reduced-motion: reduce) {
	.anim-hidden, .anim-scale, .anim-left, .anim-right,
	.anim-fade-down, .anim-blur, .anim-rotate {
		opacity: 1 !important;
		transform: none !important;
		filter: none !important;
	}
	.anim-float, .anim-glow, .anim-gradient-shift, .anim-ring-pulse {
		animation: none !important;
	}
	* { transition-duration: 0.01ms !important; }
}
```

- `useCountUp` immediately sets target value.
- `Typewriter` immediately renders full text. It also renders the full text hidden via `sr-only` so screen readers don't read out characters one by one.
- Page transitions skip the keyframe.

## 7.7 — File summary (Phase 7)

| Action | Path                                                                                                                          |
| ------ | ----------------------------------------------------------------------------------------------------------------------------- |
| :---   | :---                                                                                                                          |
| MODIFY | `src/lib/animations.ts` — add `useCountUp`, `useStaggeredReveal`, `useTypewriter`, `usePageTransition`, cap option |
| MODIFY | `src/app/globals.css` — add 12 new animation classes + 6 keyframes + reduced-motion block + performance optimizations      |
| NEW    | `src/components/ui/AnimatedNumber.tsx`                                                                                      |
| NEW    | `src/components/ui/RevealOnScroll.tsx`                                                                                      |
| NEW    | `src/components/ui/AnimatedProgressBar.tsx`                                                                                 |
| NEW    | `src/components/ui/Typewriter.tsx`                                                                                          |
| MODIFY | All 26 page files — apply per-page animation script above                                                                    |
| MODIFY | `src/components/layout/TopNavBar.tsx`, `SideNavBar.tsx`, `AppShell.tsx`                                                 |
| MODIFY | `src/components/doctor/ReportDrawer.tsx` — drawer slide animation polish                                                   |
| MODIFY | `src/components/ui/Skeleton.tsx`, `EmptyState.tsx`, `ErrorState.tsx`, `FileUploadZone.tsx` — entry animations        |

**Total: ~6 new files, ~32 modified files**

## 7.8 — Verification & Audit

```bash
npm run lint    # Exit 0, 0 errors, 0 warnings
npm run build   # Exit 0, all 26 routes compile
```

**Manual checks:**

- [ ] Every page renders without layout shift (CLS 0)
- [ ] No animation runs longer than 1.5s on initial paint
- [ ] `prefers-reduced-motion: reduce` strips all motion
- [ ] Lighthouse Performance ≥ 90, Best Practices ≥ 95
- [ ] No animation triggers on already-rendered content during route navigation (page transition takes over)
- [ ] **Performance Audit**: React DevTools Profiler confirms `AnimatedNumber` does not trigger cascading component re-renders. Performance tab confirms no "Layout Thrashing" warnings during route transitions.
