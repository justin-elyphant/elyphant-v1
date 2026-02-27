

# Fix: Composite Product IDs Breaking Zinc Submission in process-order-v2

## Problem Confirmed
Order `#80bbe4` has `product_id: "MC_Assembly_1#B07535Y9T6"` in its line_items. The ASIN validation at line 232 rejects this because the regex expects `B0XXXXXXXX`, not a composite ID with a prefix. The order is marked `requires_attention` and Zinc never receives it, even though Stripe already charged $28.55.

This is the same composite ID bug we fixed in `get-product-detail` — it also exists in the fulfillment pipeline.

## Fix — Single file: `supabase/functions/process-order-v2/index.ts`

### Change 1: Add ASIN extraction helper (after imports, ~line 4)
```ts
function extractAsin(rawId: string): string {
  if (rawId && rawId.includes('#')) {
    return rawId.split('#').pop() || rawId;
  }
  return rawId;
}
```

### Change 2: Normalize product IDs before validation (before line 230, after line 132 log)
Insert a normalization loop over `itemsArray` that cleans composite IDs:
```ts
for (const item of itemsArray) {
  const rawId = item.product_id || item.productId || item.id;
  const cleanId = extractAsin(rawId);
  if (cleanId !== rawId) {
    console.log(`🔄 Normalized product ID: ${rawId} → ${cleanId}`);
    item.product_id = cleanId;
  }
}
```

This ensures the ASIN regex check (line 232) and the Zinc API products array (line 360) both use the clean ASIN `B07535Y9T6`.

### Change 3: Deploy and reprocess
After deploying, order `03328120-f34a-422d-8169-7cbb5180bbe4` can be retried via `admin-order-tools` since `payment_status` is already `paid`.

## Technical Details
- The composite ID format `MC_Assembly_1#B07535Y9T6` comes from the product catalog's multi-configuration system
- The `#` delimiter separates the configuration prefix from the Amazon ASIN
- Only the ASIN portion is valid for Zinc API submission

