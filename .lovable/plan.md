

## Etsy-Inspired Header: Search Above Categories

### Concept

Taking inspiration from Etsy's layout, the search bar moves **into the main header row** between the logo and utility icons, and the category links drop to a dedicated second row below. This gives the search bar prime real estate (like Etsy) while keeping categories visible as a horizontal nav strip.

### Current Layout (Desktop)

```text
| Logo | --- Categories --- | Heart | Cart | Auth |
|--------------- Search Bar ------------------|
```

### New Layout (Desktop)

```text
| Logo | -------- Search Bar -------- | Heart | Cart | Auth |
|      Beauty | Electronics | Fashion | Under $50 | Wedding | Baby | Shop All      |
```

### Changes

**File: `src/components/navigation/ModernHeaderManager.tsx`**

1. Move the `AIEnhancedSearchBar` from the second-row block back into the main header row, positioned between the logo and the right utility icons (Heart, Cart, Auth). Give it `flex-1` with `max-w-2xl` so it stretches to fill available space -- much wider than the old 256px.

2. Move the `CategoryLinks` component out of the main row and into a new second row (where the search bar currently sits). Center them with a subtle top border separator, similar to Etsy's category strip.

3. The `TabletCategoryLinks` stay in the main row for the tablet breakpoint (768-1024px) since tablets don't show the desktop search bar.

**File: `src/components/navigation/CategoryLinks.tsx`**

No structural changes needed -- just the container in the parent moves it to the second row.

### What Stays the Same

- Mobile layout (search bar below header, no category strip)
- Tablet layout (4 category links in main row, search below)
- All existing category links and their routing
- Logo, Heart, Cart, Auth positioning on the right side

### Visual Result

The search bar gets prominent, Etsy-like placement in the main header row with generous width. Categories become a clean horizontal strip below -- easy to scan, always visible, and clearly separated from the search interaction area.

