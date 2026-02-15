

## Make "Who is this for?" Collapsible and Scrollable

### Problem
The recipient list in the Buy Now drawer renders all connections in a flat, always-visible list. With 10+ connections, it dominates the drawer and pushes the gift note, payment, and "Place your order" button off-screen.

### Solution
Wrap the recipient list in a `Collapsible` component (matching the gift note and payment sections) and add a max-height with overflow scroll to the content area.

### Technical Changes

**File: `src/components/marketplace/product-details/BuyNowDrawer.tsx`**

1. Add a new `recipientOpen` state (default `true` since a recipient must be selected)
2. Replace the static `div` container (lines 265-346) with a `Collapsible` that:
   - Shows the trigger as "Who is this for?" with the selected recipient name (or "Select recipient") and a chevron icon, matching the style of the gift note and payment collapsible rows
   - Wraps the connections list in `CollapsibleContent` with `max-h-[200px] overflow-y-auto` so it scrolls when there are many connections
3. Auto-collapse after a recipient is selected (set `recipientOpen` to `false` on selection) to keep the drawer compact
4. The trigger row shows the currently selected name (e.g., "Curt Davidson" or "Myself") as a summary when collapsed

### User Experience
- Drawer opens with the recipient section expanded (since no one is selected yet)
- User taps a recipient -- section auto-collapses, showing "Curt Davidson" as the summary
- User can re-expand to change their selection
- If 10+ connections exist, the expanded list scrolls within a fixed height
- Gift note and payment sections remain consistent in style

