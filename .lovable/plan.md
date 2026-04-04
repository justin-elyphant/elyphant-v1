

## Fix: max_price_exceeded + "Checkout Address" Recipient Name

### Bug 1: max_price too low for credit orders

**Root cause** (line 369): `subtotalDollars = order.line_items?.subtotal` — for beta credit orders, this is the credit-adjusted amount ($30.10) not the actual Amazon price ($49.94). Zinc sees max_price=5112 but Amazon charges 5431.

**Fix** (line 366-372 in `process-order-v2/index.ts`): Calculate max_price from the sum of `items[].unit_price * quantity` instead of `line_items.subtotal`. The unit_price is always the real Amazon retail price regardless of credits applied.

```typescript
// Replace subtotal-based calc with item-level calc
const productSubtotalCents = itemsArray.reduce((sum, item) => {
  const unitPrice = item.unit_price || item.price || 0;
  const qty = item.quantity || 1;
  return sum + Math.round(unitPrice * 100) * qty;
}, 0);
// Fallback to order-level subtotal if no item prices found
const finalSubtotalCents = productSubtotalCents > 0 
  ? productSubtotalCents 
  : Math.round((order.line_items?.subtotal ?? order.total_amount) * 100);
```

For order #96d709: 49.94 * 100 = 4994 → max_price = ceil(4994 * 1.20) + 1500 = **7493** — safely above 5431.

### Bug 2: "Checkout Address" as recipient name

**Root cause** (line 212): `requiredShippingFields.name = shippingAddress.name` — for self-purchase orders, `shippingAddress` comes from the order's `shipping_address` JSONB, which contains `name: "Checkout Address"` (the address label, not the person's name).

**Frontend fix** (BuyNowDrawer line 156): Add `user?.user_metadata?.name` to the fallback chain:
```typescript
name: [user?.user_metadata?.first_name, user?.user_metadata?.last_name]
  .filter(Boolean).join(' ')
  || user?.user_metadata?.name
  || defaultAddress!.name,
```

**Server-side guard** (process-order-v2 after line 211): Detect address-label names and substitute with profile name:
```typescript
const addressLabelPatterns = /^(checkout address|home|work|office|default|my address|address)$/i;
if (addressLabelPatterns.test(shippingAddress.name?.trim())) {
  const profileName = profile?.name || profile?.first_name;
  if (profileName) shippingAddress.name = profileName;
}
```

### Bug 2b: Notes string concatenation (line 343)

While we're here — line 343 still uses string concatenation for notes (`order.notes + ' | '`), which was supposed to be fixed in the pipeline restructure. Will fix to use JSONB merge.

### Files changed

| File | Change |
|------|--------|
| `supabase/functions/process-order-v2/index.ts` | max_price from item unit_prices; name guard for address labels; notes JSONB fix |
| `src/components/marketplace/product-details/BuyNowDrawer.tsx` | Add `user_metadata.name` to name fallback chain |

### What this does NOT change
- No credit logic changes — credits work correctly, it's just the max_price calc that was reading the wrong field
- No address storage changes — the guard catches bad names at fulfillment time

