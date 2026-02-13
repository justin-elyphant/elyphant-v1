
# Change "Save" Button Text to "Save to Wishlist"

## What Changes

Update the button label in `WishlistSelectionPopoverButton.tsx` from "Save" to "Save to Wishlist" so the CTA is more descriptive on the product detail page.

## Technical Details

**File: `src/components/gifting/wishlist/WishlistSelectionPopoverButton.tsx`** (line 78)

Change:
```tsx
<span className="ml-1">Save</span>
```
To:
```tsx
<span className="ml-1">Save to Wishlist</span>
```

This is a single-line text change. The button is used across the app but only shows text when `showText={true}` (currently only on the product details sidebar), so other icon-only usages are unaffected.
