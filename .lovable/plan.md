

## Remove Food & Drinks Category from Browse and Discovery

### The Problem

The "Food & Drinks" category in `UNIVERSAL_CATEGORIES` has a search term that actively pulls grocery and gourmet items from Zinc -- the exact products our new fulfillment filter blocks. This wastes Zinc API calls on items we'll discard and risks edge cases slipping through.

### Changes

**File: `src/constants/categories.ts`**

Remove the "Food & Drinks" entry (id: 10) from the `UNIVERSAL_CATEGORIES` array. This removes it from:
- The "Browse All Categories" grid on the marketplace landing page (where you spotted it)
- The "Shop by Category" section on the home page (via `getFeaturedCategories()`)
- Any category-based search routing

**File: `src/components/marketplace/landing/CategoryBrowseGrid.tsx`**

Remove `"food"` from the `BROWSE_CATEGORIES` filter list (line 11) so it no longer appears in the browse grid even if the constant were somehow retained.

### What We're NOT Changing

- **Gift preferences utility** (`utils.ts`): The "Food & Beverage" option there is a user preference tag for AI recommendations, not a product search trigger. Safe to keep.
- **Category names mapping** (`categoryNames.ts`): No "food" entry exists there already.
- **Navigation links** (`CategoryLinks.tsx`): No food category listed there.

### Impact

- One fewer category tile in the browse grid and home page
- Eliminates wasted Zinc API calls for unfulfillable grocery products
- No visual gap -- the grid will reflow naturally with one fewer tile

