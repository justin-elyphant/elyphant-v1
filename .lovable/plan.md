

# Smooth Page Transitions on Desktop

## Problem
Every time you navigate between pages on desktop, the app feels like it does a "hard refresh" because:
1. The Suspense fallback (full-screen spinner) flashes on every lazy-loaded route, even when the chunk is already cached
2. There are no transition animations between pages -- content just pops in/out
3. ScrollToTop snaps instantly to the top with no visual smoothing

## Solution

### 1. Add page transition wrapper using framer-motion (already installed)
Create a `PageTransition` component that wraps route content with a subtle fade animation using `AnimatePresence` and `motion.div`. This gives every page a smooth fade-in when it appears.

**New file: `src/components/layout/PageTransition.tsx`**
- Uses `AnimatePresence mode="wait"` keyed by `location.pathname`
- Simple fade + slight upward slide (opacity 0 to 1, y: 8px to 0)
- Fast duration (200ms) so it feels snappy, not slow

### 2. Wrap Routes with AnimatePresence in App.tsx
- Wrap the `<Routes>` block with `<AnimatePresence mode="wait">`
- Each route's page component gets wrapped with the `PageTransition` component
- The `location` key ensures animations trigger on route changes

### 3. Improve Suspense fallback to avoid flash
Replace the full-screen spinner Suspense fallback with a minimal, non-intrusive approach:
- Add a short delay (200ms) before showing the spinner so cached chunks don't flash the loader at all
- Use a subtler loading indicator (thin progress bar at top instead of full-screen spinner)

**New file: `src/components/layout/DelayedFallback.tsx`**
- Renders nothing for the first 200ms
- Then shows a minimal top progress bar instead of a centered spinner

### 4. Smooth ScrollToTop behavior
Update `ScrollToTop.tsx` to use `behavior: "smooth"` for a less jarring scroll, but only when the scroll distance is small. For large jumps (e.g., from bottom of a long page), keep `"auto"` to avoid slow visible scrolling.

## Technical Details

### PageTransition component
```text
- opacity: 0 -> 1 on enter, 1 -> 0 on exit
- y: 8px -> 0 on enter (subtle upward slide)
- duration: 0.2s with easeOut
- Keyed by location.pathname
```

### DelayedFallback component
```text
- useState with 200ms setTimeout to show/hide
- When visible: thin 2px animated bar at top of viewport
- No full-screen overlay or centered spinner
```

### Files modified
1. `src/components/layout/PageTransition.tsx` (new) -- fade transition wrapper
2. `src/components/layout/DelayedFallback.tsx` (new) -- delayed minimal loading indicator
3. `src/App.tsx` -- wrap Routes with AnimatePresence + PageTransition, use DelayedFallback
4. `src/components/layout/ScrollToTop.tsx` -- smoother scroll behavior
