

# Redesign: E-Commerce Friendly Recipient Selector in Buy Now Drawer

## Problem

Looking at the screenshot, the current layout inside the "Who is this for?" section is:
1. "Invite New Recipient" (top)
2. "Ship to Checkout Address" (second)
3. Search bar (third)
4. Then connections below

This ordering is unintuitive for e-commerce. The most common actions (ship to myself, pick a friend) are buried. "Invite New Recipient" being first is odd -- it's the least common action.

The user wants:
- Search bar visible first when dropdown opens
- Clicking into search shows top 5 connections (not 3) before typing
- "My address" (Ship to Myself) shown above the top connections
- "Invite New Recipient" moved to the bottom of the container
- Connections disappear as user types and filters
- Clean e-commerce feel

## Changes

### File: `src/components/marketplace/product-details/SimpleRecipientSelector.tsx`

**1. Reorder the inner content sections (lines 247-410)**

New order inside the `divide-y` container:
1. **Search input** -- first thing the user sees
2. **"Ship to Myself"** -- always visible, right below search
3. **Top 5 Connections** -- auto-populate when search is empty, filter as user types
4. **"Invite New Recipient"** -- moved to bottom (least common action)

Remove the "Assign Later" option when `embedded` (already hidden, confirmed).

**2. Change top connections limit from 3 to 5 (line 98)**

```tsx
// Before
return filteredConnections.slice(0, 3);

// After  
return filteredConnections.slice(0, 5);
```

Update the `hasMoreConnections` threshold to match (line 101):
```tsx
const hasMoreConnections = !searchQuery.trim() && filteredConnections.length > 5;
```

And the "+N more" count (line 383):
```tsx
+{filteredConnections.length - 5} more
```

**3. Reorder the JSX blocks inside the `divide-y` div**

Current order: Invite → Ship to Myself → Search → Connections → Assign Later

New order:
```
Search input (sticky at top)
Ship to Myself  
Top 5 Connections (or filtered results)
Invite New Recipient (at bottom)
```

Move the search `<div>` block (lines 292-303) to be the first child.
Move "Ship to Myself" block (lines 271-289) to be second.
Move "Invite New Recipient" block (lines 249-268) to be after the connections section.

**4. Update section header text**

When not searching, show "Your Connections" instead of "Your Top Connections" (cleaner for e-commerce). When searching, show "Results".

## Scope

1 file: `SimpleRecipientSelector.tsx`. Reorder existing blocks + change limit from 3→5. No new components, no backend changes. The BuyNowDrawer integration stays unchanged since it uses `embedded={true}` and the selector handles its own layout.

