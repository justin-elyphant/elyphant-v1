
## Fix: Bottom Navigation Floating on iOS Safari

### Problem
When Safari's bottom toolbar hides during scrolling, the nav bar "floats" above the screen edge because:
- The safe area spacer collapses to 0px when Safari's toolbar disappears
- `rounded-t-3xl` on the container shows page content peeking beneath the rounded corners
- `shadow-floating` adds a visible drop shadow underneath, reinforcing the floating look

When Safari's toolbar IS visible, it covers the gap so everything looks fine.

### Solution
Restructure the component so a solid white background always extends to the absolute bottom of the viewport, with the rounded/blurred visual treatment applied only to an inner wrapper.

### Scope
This is a single shared component (`MobileBottomNavigation.tsx`) rendered once in `App.tsx` at the root level. The fix automatically applies to every page -- no per-page changes needed.

### Technical Changes

**File: `src/components/navigation/MobileBottomNavigation.tsx`**

Restructure from one container to two layers:

1. **Outer `nav`** -- keeps `fixed bottom-0 left-0 right-0` positioning. Gets a solid `bg-white` background that extends all the way to the screen edge. No rounded corners on bottom. Padding-bottom uses `env(safe-area-inset-bottom)` so the white fill always covers the gap.

2. **Inner wrapper** -- the visual "pill" with `backdrop-blur-xl`, `border-t`, and `rounded-t-2xl`. Contains only the tab row (`h-14`). This is the part users see.

3. **Remove `shadow-floating`** -- replace with just `border-t` for separation. The shadow underneath contributes to the floating illusion.

4. **Remove the separate safe-area spacer div** -- the outer container's `pb-[env(safe-area-inset-bottom)]` handles this instead, and since it has a solid white background, there is never a visible gap.

```text
Before:
+---------------------------+
|  rounded-t-3xl container  |  <-- bg-white/80 + blur
|  [tab row h-14]           |
|  [safe-area spacer div]   |  <-- collapses to 0 = gap
+---------------------------+
    ^ gap visible here when Safari toolbar hides

After:
+---------------------------+
|  inner pill (rounded-t)   |  <-- backdrop-blur + border-t
|  [tab row h-14]           |
+---------------------------+
|  outer solid bg-white     |  <-- pb-[env(safe-area-inset-bottom)]
|  (no rounding, no gap)    |
+===========================+  <-- screen edge, always flush
```

This ensures the navigation is always flush with the bottom of the screen regardless of Safari toolbar state, while preserving the rounded iOS-style appearance on top.
