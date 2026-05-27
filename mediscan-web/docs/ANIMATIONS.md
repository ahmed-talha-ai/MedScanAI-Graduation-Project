# Animations Guide

This document outlines the animation system used in MediScan AI.

## Philosophy
- **Subtle & Professional:** Animations should feel smooth and clinical, not bouncy or excessive.
- **Performant:** We rely on CSS `will-change`, `transform`, and `opacity` to ensure hardware-accelerated animations (avoiding layout thrashing).
- **Accessible:** All animations respect `prefers-reduced-motion: reduce`. When active, animations instantly snap to their final states to prevent vertigo.

## Base Utility Classes (from `globals.css`)
- `.anim-fade-up-in`: Slides the element up 32px while fading opacity from 0 to 1 over 750ms.
- `.anim-fade-down-in`: Slides the element down 32px while fading opacity from 0 to 1 over 750ms.
- `.anim-scale-in`: Scales from 0.85 to 1.0 while fading in.
- `.anim-left-in` / `.anim-right-in`: Slides in from left or right.
- `.anim-blur-in`: Transitions from `blur(8px)` to `blur(0)` while fading in.
- `.anim-rotate-in`: Un-rotates from -8deg while scaling up.
- `.anim-glow`: Continuous pulsing shadow used for AI results.
- `.anim-ring-pulse`: Continuous expanding rings used for live health checks.

## React Integration (`src/lib/animations.ts`)

We expose an `ANIM_CLASSES` object to easily apply animations:
```typescript
export const ANIM_CLASSES = {
  fadeUp: 'anim-fade-up',
  fadeUpIn: 'anim-fade-up-in',
  scale: 'anim-scale',
  scaleIn: 'anim-scale-in',
  // ...
};
```

### Staggered Animations
Use the `staggerDelay(index, baseDelay)` utility to create waterfall effects across lists:
```tsx
<div 
  className={ANIM_CLASSES.fadeUpIn} 
  style={{ transitionDelay: staggerDelay(index, 100) }}
>
```

### Intersection Observer Hook
For scroll-triggered animations, use `useInView()`:
```tsx
const [ref, isVisible] = useInView({ threshold: 0.1 });

<div ref={ref} className={isVisible ? ANIM_CLASSES.fadeUpIn : ANIM_CLASSES.fadeUp}>
```
