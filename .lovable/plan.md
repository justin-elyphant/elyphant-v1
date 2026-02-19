
# Cookie Consent Banner — iOS Capacitor Compliance Patch

## What's Missing Right Now

The redesign nailed the visual direction (monochromatic, flush bar, black pill CTA) but did not address iOS Capacitor touch standards. Three concrete gaps remain:

### Gap 1 — Touch Targets Below 44px

iOS Human Interface Guidelines and the project's own Capacitor memory require a 44px minimum tap target on all interactive elements.

| Element | Current height | Issue |
|---|---|---|
| Accept All button | `h-9` = 36px | 8px short |
| Essential Only button | `h-9` = 36px | 8px short |
| X dismiss button | 16px (icon only) | 28px short |
| "More info" toggle | text inline, ~20px | 24px short |

Fix: Bump primary buttons to `h-11` (44px). Wrap the X button in a `flex items-center justify-center min-w-[44px] min-h-[44px]` container. Give the "More info" inline button `py-2` so its tap region expands.

### Gap 2 — No `touch-manipulation` on Buttons

Without `touch-manipulation`, iOS Safari adds a 300ms delay to tap events on buttons. All three buttons (Accept All, Essential Only, X) need `touch-manipulation` added to their className.

### Gap 3 — Safe Area Inset Not Respected

The banner uses `pb-14 lg:pb-0` to clear the mobile bottom nav. This is correct for the nav bar itself, but the mobile nav itself uses `env(safe-area-inset-bottom)` for the home indicator. The banner's bottom padding should stack the nav clearance + safe area:

```
pb-14 lg:pb-0
```
should become:
```
pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))] lg:pb-0
```

This ensures the banner sits correctly above the nav + home indicator on iPhone 12/13/14/15 (which have ~34px home indicator safe area).

### Gap 4 — Hover-Only Active States

`hover:bg-foreground/90` and `hover:bg-gray-50` are invisible on touch devices. Active state feedback (the visual "press" response) needs an `active:` variant alongside `hover:`:

- Accept All: add `active:bg-foreground/80`
- Essential Only: add `active:bg-gray-100`
- X button: add `active:opacity-70`

### Gap 5 — Tablet Offset Verification

On tablet (768px–1023px), the `lg:hidden` mobile nav is still visible. The banner's `pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))]` handles this correctly since it uses the same 56px clearance as the mobile nav height. No separate tablet breakpoint needed — the formula covers both phone and tablet.

## Files to Modify

One file only:
- `src/components/legal/CookieConsentBanner.tsx`

## Exact Changes

### Outer wrapper — safe area + touch
```
className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-border 
  pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))] lg:pb-0"
```

### Accept All button
```
h-9 → h-11
add: touch-manipulation active:bg-foreground/80 active:scale-95
```

### Essential Only button
```
h-9 → h-11
add: touch-manipulation active:bg-gray-100 active:scale-95
```

### X dismiss button — wrap in a proper touch target
```jsx
<button
  onClick={acceptEssential}
  className="flex items-center justify-center min-w-[44px] min-h-[44px] text-muted-foreground ml-1 shrink-0 touch-manipulation active:opacity-70"
  aria-label="Dismiss cookie banner"
>
  <X className="h-4 w-4" />
</button>
```

### "More info" inline button — expand tap area
```
add: py-2 touch-manipulation active:opacity-70
```

## Visual Impact

These changes are invisible to the eye on desktop. On mobile/tablet they ensure:
- Every tap registers on first touch (no 300ms delay)
- Every button is comfortably tappable with a thumb
- The banner never clips behind the iPhone home indicator
- Press states give immediate tactile-like visual feedback

## Summary Table

| Standard | Before | After |
|---|---|---|
| 44px touch targets | ❌ 36px buttons, 16px X | ✅ 44px all interactive elements |
| `touch-manipulation` | ❌ Missing | ✅ All buttons |
| Safe area inset | ❌ Hardcoded 56px | ✅ `calc(3.5rem + env(safe-area-inset-bottom))` |
| Active press states | ❌ Hover only | ✅ `active:` variants on all buttons |
