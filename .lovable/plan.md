

# Fix Incorrect Pricing Display: Remove Erroneous Cents-to-Dollars Conversion

## Problem Summary

The order details page and email templates display impossibly low pricing values:

| Field | Displayed | Actual (DB) | Expected |
|-------|-----------|-------------|----------|
| Subtotal | $0.27 | 26.97 | $26.97 |
| Shipping | $0.07 | 6.99 | $6.99 |
| Tax | $0.02 | 2.36 | $2.36 |
| Gifting Fee | $0.04 | 3.697 | $3.70 |

**Root Cause:** Two files incorrectly divide prices by 100, assuming values are stored in cents when they're actually stored in dollars.

---

## Technical Analysis

### Data Flow (Verified)

1. **Frontend checkout** sends `pricingBreakdown` in dollars (e.g., `subtotal: 26.97`)
2. **create-checkout-session** stores these dollar values as strings in Stripe metadata
3. **stripe-webhook-v2** reads metadata and stores as numbers in `line_items` JSONB:
   ```json
   {
     "subtotal": 26.97,
     "shipping": 6.99,
     "tax": 2.36,
     "gifting_fee": 3.697,
     "items": [...]
   }
   ```
4. **Bug location 1:** `orderPricingUtils.ts` divides by 100:
   ```typescript
   const subtotalFromLineItems = lineItems.subtotal ? lineItems.subtotal / 100 : null;
   // Result: 26.97 / 100 = 0.2697 → displays as "$0.27"
   ```
5. **Bug location 2:** `ecommerce-email-orchestrator/index.ts` divides by 100:
   ```typescript
   subtotal: (order.line_items as any)?.subtotal / 100
   // Result: 26.97 / 100 = 0.2697 → displays as "$0.27"
   ```

---

## Files to Modify

### 1. `src/utils/orderPricingUtils.ts`

**Current (buggy):**
```typescript
// Line 24-30 - WRONG: Assumes cents when values are actually dollars
const shippingFromLineItems = lineItems.shipping ? lineItems.shipping / 100 : null;
const taxFromLineItems = lineItems.tax ? lineItems.tax / 100 : null;
const subtotalFromLineItems = lineItems.subtotal ? lineItems.subtotal / 100 : null;
const giftingFeeFromLineItems = lineItems.gifting_fee ? lineItems.gifting_fee / 100 : null;
```

**Fixed:**
```typescript
// Values in line_items JSONB are stored in DOLLARS (not cents)
// Example: subtotal: 26.97 means $26.97
const shippingFromLineItems = lineItems.shipping ?? null;
const taxFromLineItems = lineItems.tax ?? null;
const subtotalFromLineItems = lineItems.subtotal ?? null;
const giftingFeeFromLineItems = lineItems.gifting_fee ?? null;
```

### 2. `supabase/functions/ecommerce-email-orchestrator/index.ts`

**Current (buggy):**
```typescript
// Lines 696-699 and 703 - WRONG: Divides dollars by 100
subtotal: (order.line_items as any)?.subtotal ? (order.line_items as any).subtotal / 100 : 0,
shipping_cost: (order.line_items as any)?.shipping ? (order.line_items as any).shipping / 100 : 0,
tax_amount: (order.line_items as any)?.tax ? (order.line_items as any).tax / 100 : 0,
gifting_fee: (order.line_items as any)?.gifting_fee ? (order.line_items as any).gifting_fee / 100 : 0,
...
price: item.price ? item.price / 100 : 0,  // Line 703
```

**Fixed:**
```typescript
// Values in line_items JSONB are stored in DOLLARS (not cents)
subtotal: (order.line_items as any)?.subtotal || 0,
shipping_cost: (order.line_items as any)?.shipping || 0,
tax_amount: (order.line_items as any)?.tax || 0,
gifting_fee: (order.line_items as any)?.gifting_fee || 0,
...
price: item.price || 0,  // Already in dollars
```

---

## Impact After Fix

| Component | Before Fix | After Fix |
|-----------|------------|-----------|
| Order Detail page | $0.27 subtotal | $26.97 subtotal |
| Order Confirmation | $0.27 subtotal | $26.97 subtotal |
| Pending Payment emails | $0.27 subtotal | $26.97 subtotal |
| Shipped/Delivered emails | $0.27 subtotal | $26.97 subtotal |

---

## Verification Plan

1. Deploy updated `ecommerce-email-orchestrator`
2. Refresh the order detail page at `/orders/bd3c262e-34db-4faf-8849-c2e9a8cf4e1f`
3. Confirm pricing displays correctly:
   - Subtotal: $26.97
   - Shipping: $6.99
   - Tax: $2.36
   - Gifting Fee: $3.70
   - Total: $40.02
4. Trigger a test email and verify pricing is correct in the email

---

## Memory Update

Add a project memory entry documenting that **pricing values in `orders.line_items` JSONB are stored in dollars (not cents)** to prevent future confusion.

