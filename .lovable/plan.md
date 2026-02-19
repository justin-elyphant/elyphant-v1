
# Cookie Consent Banner — Desktop Size Reduction

## The Problem

On desktop the banner stretches full width (`left-0 right-0`) with just the inner text constrained to `max-w-4xl`. The white background and border-top span the entire screen, making it feel like a takeover. The goal is a compact, centered bar that sits quietly at the bottom on desktop without dominating the viewport.

## Compliance Note

There are no size requirements in GDPR, ePrivacy, or CCPA. The only requirements are that the banner is clearly visible, easy to read, and that consent is unambiguous. A compact centered bar satisfies all of these.

## Approach: Two-Tier Layout

- **Mobile (default):** Keep the current full-width flush bar with safe area insets — correct for small screens and the bottom nav.
- **Desktop (lg:):** Switch to a centered, width-constrained floating bar anchored to the bottom center. This is the standard pattern used by sites like Lululemon, Stripe, Linear, and Vercel.

## Exact Design Change

### Mobile (unchanged)
```
fixed bottom-0 left-0 right-0 — full width, flush, border-top
pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))] — clears bottom nav + safe area
```

### Desktop (new)
Instead of `left-0 right-0`, switch to a centered approach:
```
fixed bottom-6 left-1/2 -translate-x-1/2 — centered, floating 24px from bottom
w-full max-w-2xl — constrained to ~672px wide (roughly half the screen on 1440px)
rounded-xl border border-border shadow-sm — subtle card, not flush bar
bg-white px-5 py-4
```

The `border-t` border-top only makes sense on a full-width flush bar. On the centered floating card, it becomes a full `border border-border` with a subtle `shadow-sm` so it reads as a contained element.

## Responsive Classes Summary

| Property | Mobile | Desktop (lg:) |
|---|---|---|
| Position | `left-0 right-0 bottom-0` | `bottom-6 left-1/2 -translate-x-1/2` |
| Width | full viewport | `w-full max-w-2xl` |
| Corners | none (flush bar) | `rounded-xl` |
| Border | `border-t border-border` | `border border-border` |
| Shadow | none | `shadow-sm` |
| Bottom padding | `pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))]` | `pb-0 (default py-4)` |

## Implementation

The `motion.div` currently has one flat className string. It needs to be split into mobile-first classes with `lg:` overrides:

```tsx
className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-border
  pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))]
  lg:bottom-6 lg:left-1/2 lg:-translate-x-1/2 lg:right-auto
  lg:w-full lg:max-w-2xl lg:rounded-xl lg:border lg:border-border
  lg:shadow-sm lg:pb-0"
```

The inner `<div className="max-w-4xl mx-auto px-4 py-3">` on desktop should become `px-5 py-4` and drop the `max-w-4xl` constraint since the outer card already controls width — change to `lg:max-w-none`.

## Motion Animation

The `y: 60` slide-up works well for both layouts — no change needed.

## Files to Modify

One file only:
- `src/components/legal/CookieConsentBanner.tsx`

## Visual Result

- **Mobile/tablet:** Unchanged — full-width flush bar above the bottom nav with safe area support.
- **Desktop:** A compact ~672px centered card floating 24px above the bottom of the viewport. Clean, minimal, non-intrusive — matching how Lululemon and other premium e-commerce sites handle cookie consent.
