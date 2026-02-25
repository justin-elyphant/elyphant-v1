

# Fix Touch Scroll in Select Dropdowns on Tablet

## Root Cause

The `onWheel` fix we applied only intercepts **mouse wheel / trackpad** scroll events. On a tablet with finger touch, the browser fires **touch events** (`touchstart`, `touchmove`, `touchend`) instead -- these still propagate up to the parent Dialog, which captures them and prevents the dropdown list from scrolling.

The keyboard/trackpad worked because those generate wheel events. Finger touch does not.

## Solution

Add `onTouchMove={(e) => e.stopPropagation()}` to the `SelectPrimitive.Viewport` in `src/components/ui/select.tsx`. This is the shared Select component, so the fix applies globally to every Select dropdown in the app -- including the date picker, and any future Select inside a Dialog.

## Changes

### File: `src/components/ui/select.tsx`

**Viewport element (line 84-96):** Add `onTouchMove` propagation stop alongside the existing `onWheel` stop:

```
// Line 84-96, add onTouchMove handler
<SelectPrimitive.Viewport
  className={cn(
    "p-1 overflow-y-auto overscroll-contain touch-pan-y",
    position === "popper" &&
      "w-full min-w-[var(--radix-select-trigger-width)]"
  )}
  style={{
    WebkitOverflowScrolling: 'touch',
    scrollbarWidth: 'thin',
    maxHeight: '240px'
  } as React.CSSProperties}
  onWheel={(e) => e.stopPropagation()}
  onTouchMove={(e) => e.stopPropagation()}
>
```

This single line addition ensures touch scroll gestures stay contained within the dropdown viewport and don't bubble up to the Dialog overlay.

## Scope
1 file, 1 line added. No logic changes, no backend impact. Fixes all Select dropdowns inside Dialogs app-wide.

