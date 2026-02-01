
# Variant Data Persistence: Product Page → Wishlist → Stripe → Zinc

## Problem Summary

When a user selects a product variant (e.g., "Red" phone case) and adds it to their wishlist, the **parent product ASIN** is stored instead of the **variant-specific ASIN**. This causes Zinc to fulfill with the wrong product.

**Current Flow (Broken)**:
```
User selects "Red" case (ASIN: B0FGCLY123) → Clicks "Add to Wishlist" 
→ Wishlist stores parent ASIN (B0FGCLY8J2) → Stripe → Zinc orders wrong item
```

**Target Flow (Fixed)**:
```
User selects "Red" case (ASIN: B0FGCLY123) → Clicks "Add to Wishlist" 
→ Wishlist stores variant ASIN (B0FGCLY123) → Stripe → Zinc orders correct item
```

---

## Solution: Minimal Changes to Existing Code

The fix follows e-commerce industry standards (Amazon, Shopify) where **each variant is treated as a distinct SKU**. No database migrations required.

### Files to Modify

| File | Change |
|------|--------|
| `WishlistSelectionPopoverButton.tsx` | Accept optional `selectedProductId` and `variationText` props |
| `ProductDetailsActionsSection.tsx` | Pass variant data to `WishlistSelectionPopoverButton` |
| `wishlistConversions.ts` | Preserve `description` field (already supports variant text) |

---

## Implementation Details

### 1. Update `WishlistSelectionPopoverButton` Interface

Extend the product interface to optionally accept variant-specific data:

```typescript
interface WishlistSelectionPopoverButtonProps {
  product: {
    id: string;               // Parent product ASIN
    name: string;
    price?: number;
    image?: string;
    brand?: string;
    // NEW: Variant-specific fields
    selectedProductId?: string;  // Variant ASIN (overrides id)
    variationText?: string;      // "Color: Red, Size: Large"
  };
  // ... existing props
}
```

When saving to wishlist, use `selectedProductId` if present:
```typescript
const handleAddToWishlist = async (wishlistId: string) => {
  await addToWishlist(wishlistId, {
    product_id: product.selectedProductId || product.id,  // Variant ASIN first
    name: product.variationText 
      ? `${product.name} (${product.variationText})` 
      : product.name,
    // ... rest unchanged
  });
};
```

### 2. Pass Variant Data from Product Details

In `ProductDetailsActionsSection.tsx`, update the popover calls:

```typescript
<WishlistSelectionPopoverButton
  product={{
    id: product.product_id || product.id,
    selectedProductId: selectedProductId,  // NEW: Variant ASIN
    variationText: variationText,          // NEW: "Color: Red"
    name: product.title || product.name || "",
    image: product.image || "",
    price: product.price,
    brand: product.brand || "",
  }}
  // ... rest unchanged
/>
```

### 3. Display Variant Info in Wishlist

The `wishlist_items.title` or existing `name` field will contain the variant description (e.g., "iPhone Case (Color: Red)"), providing clear visual feedback without database changes.

---

## Data Flow After Fix

```
┌─────────────────┐     ┌─────────────────────────────────────┐
│  Product Page   │────▶│  WishlistSelectionPopoverButton     │
│  (User selects  │     │  - Receives selectedProductId       │
│   "Red" variant)│     │  - Receives variationText           │
└─────────────────┘     └─────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    wishlist_items table                     │
│  ┌─────────────┬────────────────────────────────────────┐   │
│  │ product_id  │ B0FGCLY123 (variant ASIN, not parent)  │   │
│  │ name        │ "iPhone Case (Color: Red)"             │   │
│  │ price       │ 29.99                                  │   │
│  └─────────────┴────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Cart → Stripe → Zinc (No Changes)              │
│  - Uses product_id from wishlist_items                      │
│  - Zinc receives correct variant ASIN                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Why This Works

1. **Industry Standard**: Amazon/Shopify treat each variant as a distinct product ID (SKU)
2. **Zero Database Migration**: Uses existing `product_id` and `name` columns
3. **Backward Compatible**: If `selectedProductId` is undefined, falls back to `id`
4. **Minimal Code Changes**: Only 2 files need updates
5. **Preserves Existing Logic**: Cart → Stripe → Zinc pipeline unchanged

---

## Testing Checklist

After implementation, test this flow:

1. Navigate to a product with variants (e.g., `/marketplace/product/B0FGCLY8J2`)
2. Select a specific variant (e.g., "Black" color)
3. Click the heart icon to add to wishlist
4. Verify wishlist item shows variant name (e.g., "Case (Color: Black)")
5. Query `wishlist_items` to confirm `product_id` is the **variant ASIN**, not parent
6. Add wishlist item to cart → Proceed to checkout
7. Verify Stripe metadata contains variant ASIN
8. (If testing Zinc) Confirm order fulfillment is for correct variant
