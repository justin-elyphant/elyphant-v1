

## Fix: Cents vs Dollars Inconsistency Across the Entire Platform

### The Core Problem

Stripe returns pricing in **cents**. Our platform standard is to store everything in **dollars**. But `stripe-webhook-v2` stores cents in two of its three order-creation paths, causing every downstream consumer to display prices 100x too high.

### Where the Bug Lives (Source of Truth)

**File: `supabase/functions/stripe-webhook-v2/index.ts`**

The webhook captures pricing from Stripe line items in cents (e.g., `shippingAmount = 699` for $6.99). It correctly converts `total_amount` with `/ 100` but forgets to convert the `line_items` pricing fields.

| Order Path | Lines | Bug? | What Happens |
|---|---|---|---|
| Single-recipient | 546-551 | YES -- stores cents | `subtotal: 2098` instead of `20.98` |
| Multi-recipient child | 694-699 | YES -- stores cents | `groupSubtotal: unit_price * qty * 100` |
| Deferred/setup (card-save) | 1041-1046 | No -- reads from metadata in dollars | Correct |

### All Affected Downstream Consumers

Every component and function that reads `order.line_items.subtotal/shipping/tax/gifting_fee` is impacted:

**Frontend Pages:**
1. `src/pages/OrderConfirmation.tsx` -- Order confirmation page (the screenshot you saw)
2. `src/pages/OrderDetail.tsx` -- Order detail page
3. `src/components/orders/EnhancedOrderItemsTable.tsx` -- Admin order items table
4. `src/components/orders/mobile/MobileOrderItemsList.tsx` -- Mobile order items view

All four use `getOrderPricingBreakdown()` which trusts the values as dollars.

**Email Orchestrator:**
5. `supabase/functions/ecommerce-email-orchestrator/index.ts` (lines 957-960) -- Reads `line_items.subtotal`, `line_items.shipping`, etc. directly and formats them as dollars. Customer emails show $2,098.00 instead of $20.98.

**Conflicting Utility (separate bug):**
6. `src/lib/utils/orderUtils.ts` -- `getOrderLineItemsPricing()` divides by 100 (assumes cents). This function gives correct results for the buggy data but will be WRONG once we fix the source. This function needs updating too.

### The Fix (Single Source Fix + Cleanup)

**1. Fix the source: `supabase/functions/stripe-webhook-v2/index.ts`**

Convert cents to dollars when storing line_items pricing:

Single-recipient path (lines 546-551):
```typescript
line_items: {
  items: group.items,
  subtotal: subtotalAmount / 100,
  shipping: shippingAmount / 100,
  tax: taxAmount / 100,
  gifting_fee: giftingFeeAmount / 100
},
```

Multi-recipient child path (lines 694-699):
```typescript
// Also fix line 678 which multiplies by 100 unnecessarily
const groupSubtotal = group.items.reduce(
  (sum, item) => sum + (item.unit_price * item.quantity), 0
);
// ... proportional calculations stay the same but use dollar-based subtotalAmount
line_items: {
  items: group.items,
  subtotal: groupSubtotal,
  shipping: groupShipping / 100,
  tax: groupTax / 100,
  gifting_fee: groupGiftingFee / 100
},
```

**2. Fix the conflicting utility: `src/lib/utils/orderUtils.ts`**

Remove the `/ 100` division in `getOrderLineItemsPricing()` since values will now be stored in dollars:

```typescript
// BEFORE (wrong after fix):
subtotal: (lineItems.subtotal || 0) / 100,

// AFTER (correct):
subtotal: lineItems.subtotal || 0,
```

Also update the comment from "Values are stored in CENTS from Stripe" to "Values are stored in DOLLARS".

**3. No changes needed for these (they already assume dollars):**
- `src/utils/orderPricingUtils.ts` -- `getOrderPricingBreakdown()` already correct
- `supabase/functions/ecommerce-email-orchestrator/index.ts` -- already reads as dollars
- All frontend components using `getOrderPricingBreakdown()` -- already correct

### Files Changed

| File | Change |
|---|---|
| `supabase/functions/stripe-webhook-v2/index.ts` | Divide pricing fields by 100 before storing (lines 548-551, 678, 696-699) |
| `src/lib/utils/orderUtils.ts` | Remove `/ 100` division in `getOrderLineItemsPricing` (lines 78-81) |

### Data Correction for Existing Orders

Any orders created through paths 1 or 2 currently have inflated values. Run this SQL to fix them:

```sql
UPDATE orders 
SET line_items = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(line_items, '{subtotal}', to_jsonb(((line_items->>'subtotal')::numeric) / 100)),
      '{shipping}', to_jsonb(((line_items->>'shipping')::numeric) / 100)
    ),
    '{tax}', to_jsonb(((line_items->>'tax')::numeric) / 100)
  ),
  '{gifting_fee}', to_jsonb(((line_items->>'gifting_fee')::numeric) / 100)
)
WHERE line_items->>'subtotal' IS NOT NULL
  AND (line_items->>'subtotal')::numeric > 1000
  AND status != 'pending_payment';
```

The `WHERE` clause targets only orders stored in cents (subtotal > 1000 means > $10 in cents) and excludes deferred orders which are already correct.
