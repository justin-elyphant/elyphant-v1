

# Improve Desktop Layout for Recurring Gift Modal

## Problem

The "Set Up Recurring Gift" modal uses `sm:max-w-md` (448px max-width) on desktop. This is fine for the simpler product-mode scheduling flow (single date picker), but in **standalone mode** the `MultiEventSelector` renders a 2-column grid (`grid-cols-1 md:grid-cols-2`) of 6 occasion cards inside that narrow container. At 448px, each card column gets only ~200px, causing text to wrap awkwardly ("Justin Meeks hasn't set a date" breaks to 3 lines) and the cards look cramped/bunched up.

## Solution

Widen the desktop Dialog container **only** when in standalone mode, where the multi-event grid needs room. The product-mode dialog stays at `sm:max-w-md` since its single-event UI fits perfectly.

### Changes

**File: `src/components/gifting/unified/UnifiedGiftSchedulingModal.tsx`**

1. **Widen the desktop Dialog for standalone mode** (line 1092):
   - Change `sm:max-w-md` to `sm:max-w-lg` (512px) when `standaloneMode` is true
   - This gives each card column ~232px instead of ~200px -- enough room for occasion labels + date badges + disabled sublabels without excessive wrapping

2. **Improve the MultiEventSelector card layout for desktop** -- in the `MultiEventSelector.tsx` component, optimize the card internals for wider containers:

**File: `src/components/gifting/events/add-dialog/MultiEventSelector.tsx`**

3. **Tighten card padding on desktop**: The cards currently use `p-4` universally. On desktop where touch targets are less constrained, reduce to `p-3` while keeping `p-4` on mobile/tablet via responsive classes (`p-3 lg:p-3`). Actually, `p-4` is fine -- the real issue is text layout inside each card.

4. **Fix the card internal layout**:
   - The sublabel (date badge or "hasn't set a date" text) currently sits inline beside the label with `flex items-center gap-2`, which forces horizontal cramming. On desktop, stack the sublabel below the label for disabled items so the "(hasn't set a date)" text doesn't compete for horizontal space.
   - For enabled items with date badges, keep them inline since badges are compact.

5. **Adjust the grid gap**: Reduce `gap-3` to `gap-2` on desktop to use space more efficiently, keeping `gap-3` on mobile.

6. **Add `min-h-[56px]` to each card** to prevent height inconsistency between cards that have sublabels and those that don't.

### Visual Result

```text
Before (448px dialog, 2-col grid):
+--[~200px card]--+  +--[~200px card]--+
| [] Birthday Feb  |  | [] Anniversary  |
|              19  |  | (Justin Meeks   |
|                  |  |  hasn't set a   |
|                  |  |  date)          |
+------------------+  +-----------------+

After (512px dialog, 2-col grid):
+----[~232px card]----+  +----[~232px card]----+
| [] Birthday  Feb 19 |  | [] Anniversary      |
|                      |  | (hasn't set a date) |
+----------------------+  +---------------------+
```

### Technical Details

**UnifiedGiftSchedulingModal.tsx** (line 1092):
- Current: `className="sm:max-w-md max-h-[90vh] flex flex-col"`
- New: Use `cn()` to conditionally apply `sm:max-w-lg` when `standaloneMode` is true, otherwise keep `sm:max-w-md`

**MultiEventSelector.tsx** (lines 345-408):
- Add `lg:gap-2` to the grid container for tighter desktop spacing
- Add `min-h-[56px]` to each card for consistent heights
- Ensure sublabel text for disabled items wraps gracefully with `line-clamp-2` or `text-xs leading-tight`
- The date badge for enabled items stays inline (`flex-wrap` handles overflow naturally)

### Files Modified
| File | Change |
|------|--------|
| `src/components/gifting/unified/UnifiedGiftSchedulingModal.tsx` | Widen desktop dialog to `sm:max-w-lg` in standalone mode |
| `src/components/gifting/events/add-dialog/MultiEventSelector.tsx` | Optimize card layout density for desktop: consistent heights, tighter sublabel text |

### What Stays the Same
- Mobile/tablet Drawer rendering (below 1024px) -- completely unchanged
- Product-mode dialog width (`sm:max-w-md`) -- unchanged
- iOS Capacitor compliance (44px touch targets, haptic feedback, safe areas) -- all preserved
- The `MultiHolidaySelector` sub-component -- no changes needed
- All backend logic -- zero changes

