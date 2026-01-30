
# Unified Pricing Architecture Plan

## Executive Summary

You are correct - the current pricing implementation is **not e-commerce industry standard**. The codebase has **5 different pricing patterns** scattered across 109+ files, leading to inconsistent displays like the Made In knife showing $1.19 instead of $119.00.

## Current State: Pricing Chaos

### Pattern Audit Results

| Pattern | Files Using | Example | Problem |
|---------|-------------|---------|---------|
| `formatPrice()` with source options | 27 files | `formatPrice(price, { productSource: 'zinc_api' })` | Correct but inconsistently applied |
| `formatPriceWithDetection()` | 5 files | `formatPriceWithDetection(item)` | Uses flawed detection heuristic |
| `$${price.toFixed(2)}` inline | 47 files | `<span>${item.price.toFixed(2)}</span>` | No conversion, no validation |
| `validateAndNormalizePrice()` | 3 files | Wishlist totals | Has its own cents→dollars logic |
| `$${price}` template literal | 30+ files | `<p>${item.price}</p>` | No formatting at all |

### Root Causes

1. **No single source of truth**: Three separate price functions with different logic
2. **Detection heuristics fail**: `detectProductSource()` incorrectly assumes Amazon images or prices > $100 mean cents
3. **Database NULL values**: 16 of 19 wishlist items have `product_source: NULL`
4. **No enforcement layer**: Components choose any pattern they want

### Visual: Current Pricing Flow (Broken)

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CURRENT PRICING FLOW (BROKEN)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Database: price = 119, product_source = NULL                               │
│                    │                                                        │
│                    ├──► ProductCard.tsx uses formatPrice()                  │
│                    │    └─► No source specified → no conversion → $119.00 ✓ │
│                    │                                                        │
│                    ├──► EnhancedWishlistCard uses formatPriceWithDetection()│
│                    │    └─► detectProductSource() runs                      │
│                    │        └─► Amazon image URL detected → 'zinc_api'      │
│                    │            └─► price / 100 = $1.19 ✗                    │
│                    │                                                        │
│                    ├──► CheckoutSummary uses ${price.toFixed(2)}            │
│                    │    └─► No conversion → $119.00 ✓                       │
│                    │                                                        │
│                    └──► PinterestStyleWishlistGrid uses validateAndNormalizePrice()
│                         └─► Integer 119 → 119/100 = $1.19 ✗                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## E-Commerce Industry Standard

Modern e-commerce platforms (Shopify, Stripe, Amazon) follow these principles:

1. **Single Price Type**: Store ALL prices in one format (dollars OR cents, not both)
2. **Explicit Source Marking**: Products tagged at ingestion, not detected at display
3. **One Formatting Function**: All components use the same utility
4. **No Guessing**: Never infer price format from magnitude or image URLs

## Proposed Solution: Unified Pricing Service

### Architecture: Single Source of Truth

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                      PROPOSED PRICING FLOW (CORRECT)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Database: price = 119, product_source = 'manual' (set at ingestion)        │
│                    │                                                        │
│                    ▼                                                        │
│           ┌───────────────────────────────────────┐                         │
│           │   formatPrice(price, { productSource })│   ← ONE FUNCTION       │
│           │   src/lib/utils/pricing.ts             │                        │
│           └───────────────────────────────────────┘                         │
│                    │                                                        │
│                    ▼                                                        │
│           ┌───────────────────────────────────────┐                         │
│           │  if source === 'zinc_api' → divide    │                         │
│           │  if source === 'manual' → as-is       │   ← EXPLICIT RULES      │
│           │  if source === null → as-is (safe)    │                         │
│           └───────────────────────────────────────┘                         │
│                    │                                                        │
│                    ▼                                                        │
│              All Components → $119.00 ✓                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Implementation Plan

### Phase 1: Fix Detection Heuristics (Critical - Immediate)

Stop the bleeding by removing dangerous auto-detection.

| File | Change |
|------|--------|
| `src/utils/productSourceDetection.ts` | Remove image URL and price magnitude heuristics |
| `src/lib/utils.ts` | Remove cents detection in `validateAndNormalizePrice()` |

**Specific Changes:**

**productSourceDetection.ts - Lines 38-58 (REMOVE):**
```typescript
// DELETE these heuristics entirely:
if (imageUrl.includes('amazon') || 
    imageUrl.includes('ssl-images-amazon') || 
    imageUrl.includes('m.media-amazon')) {
  return 'zinc_api';  // ❌ Causes false positives
}

if (price > 100 && price === Math.floor(price)) {
  return 'zinc_api';  // ❌ Made In knife bug source
}
```

**utils.ts - Lines 139-146 (SIMPLIFY):**
```typescript
// BEFORE: Guesses cents format
if (Number.isInteger(numPrice)) {
  const dollarsAmount = numPrice / 100;
  if (dollarsAmount >= 0.01 && dollarsAmount < 10000) {
    return dollarsAmount; // ❌ Converts $119 to $1.19
  }
}

// AFTER: Trust database values
return numPrice; // ✓ $119 stays $119
```

### Phase 2: Standardize Component Usage (Medium Priority)

Replace all ad-hoc formatting with unified `formatPrice()`.

| Category | Files | Current Pattern | Target Pattern |
|----------|-------|-----------------|----------------|
| Checkout | 2 files | `${price.toFixed(2)}` | `formatPrice(price)` |
| Messaging | 3 files | `${item.price}` | `formatPrice(item.price)` |
| Wishlists | 4 files | Mixed patterns | `formatPrice(price)` |
| Products | 12 files | Various | Already correct |
| Orders | 5 files | `toFixed(2)` | `formatPrice(price)` |

**Example Component Fix (CheckoutSummary.tsx):**
```typescript
// BEFORE (line 30):
<span>${(item.product.price * item.quantity).toFixed(2)}</span>

// AFTER:
import { formatPrice } from "@/lib/utils";
<span>{formatPrice(item.product.price * item.quantity)}</span>
```

### Phase 3: Database Migration (Low Priority - Future)

Set `product_source` at ingestion time, not display time.

```sql
-- One-time fix for existing wishlist items
UPDATE wishlist_items 
SET product_source = 'manual'
WHERE product_source IS NULL;
```

Modify `addToWishlist()` to always set `product_source` explicitly based on where the product came from:
- Zinc API products → 'zinc_api'
- Shopify products → 'shopify'
- Manual additions → 'manual'

## Files to Modify

### Phase 1 (Critical Fixes)

| File | Lines | Action |
|------|-------|--------|
| `src/utils/productSourceDetection.ts` | 38-58 | Remove image URL and price heuristics |
| `src/lib/utils.ts` | 139-146 | Simplify `validateAndNormalizePrice()` |

### Phase 2 (Standardization)

| File | Current Pattern | Action |
|------|-----------------|--------|
| `src/components/checkout/CheckoutSummary.tsx` | `${price.toFixed(2)}` | Use `formatPrice()` |
| `src/components/checkout/CheckoutOrderSummary.tsx` | `${price.toFixed(2)}` | Use `formatPrice()` |
| `src/components/messaging/ChatGiftModal.tsx` | `${item.price}` | Use `formatPrice()` |
| `src/components/messaging/ShareToConnectionButton.tsx` | `${price.toFixed(2)}` | Use `formatPrice()` |
| `src/components/marketplace/product-item/ProductItem.tsx` | Local `formatPrice` function | Use global `formatPrice()` |
| `src/components/marketplace/product-item/ProductInfoSection.tsx` | `${price.toFixed(2)}` | Use `formatPrice()` |
| `src/components/marketplace/ui/ModernProductCard.tsx` | `${price.toFixed(2)}` | Use `formatPrice()` |
| `src/components/orders/OrderItemsTable.tsx` | `${price.toFixed(2)}` | Use `formatPrice()` |
| `src/components/gifting/wishlists/CollectionsTab.tsx` | `${total.toFixed(0)}` | Use `formatPrice()` |
| `src/components/marketplace/zinc/components/ZincProductResults.tsx` | `${price.toFixed(2)}` | Use `formatPrice()` |
| `src/components/marketplace/zinc/components/OrderCard.tsx` | `${price.toFixed(2)}` | Use `formatPrice()` |
| `src/components/marketplace/product-grid/ProductGrid.tsx` | `${price}` | Use `formatPrice()` |

### Phase 3 (Database)

| Action | Details |
|--------|---------|
| SQL migration | Set `product_source = 'manual'` for NULL values |
| Update `addToWishlist()` | Explicit source assignment at ingestion |

## Expected Outcome

After implementation:
- **Made In Bread Knife**: $119.00 (correct)
- **HP Laptop**: $499.99 (correct)
- **Levi's jeans**: $49.97 (correct)
- **All checkout displays**: Consistent formatting
- **Zero detection heuristics**: No more guessing game

## Technical Considerations

- **Phase 1 is zero-risk**: Removing bad heuristics can only fix problems
- **Phase 2 is low-risk**: Replacing inline formatting with consistent function
- **Phase 3 can wait**: Database migration is nice-to-have after display is fixed
- **Memory constraint alignment**: Matches `memory/database/pricing-storage-standard-dollars`
