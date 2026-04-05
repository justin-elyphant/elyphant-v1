

## Add Brand Name to Product Card Tile

### Problem
The brand name (`product.brand`) exists in the data and is passed around for wishlist buttons and title cleaning, but it's never displayed on the card tile. Adding it increases trust and helps shoppers identify products quickly.

### Change

**File: `src/components/marketplace/ProductCard.tsx`**

Add the brand name below the title/price row (around line 357), styled as a subtle gray text — consistent with the Lululemon aesthetic:

```tsx
{/* Brand Name - Trust Signal */}
{product.brand && (
  <p className="text-xs text-muted-foreground mb-1 truncate">
    {product.brand}
  </p>
)}
```

This goes right after the title/price `div` (line 356) and before the `ProductRating` component (line 359). Single line, truncated, small gray text — clean and unobtrusive.

### What Stays Unchanged
- Full product detail page (`ProductDetails.tsx`) already shows brand — no changes needed there
- No backend or data changes
- All other card styling untouched

