

## Fix: Confirmation Email Shows "Hi Checkout" Instead of Buyer's Name

### Problem

The order confirmation email says "Hi Checkout" because the email orchestrator (line 1677) pulls the customer name from `shippingAddress.name` — which is the **recipient's** shipping name, not the buyer's name. When someone sends a gift, the shipping address has the recipient's name (in this test case, apparently "Checkout").

### Stripe → Zinc Pipeline: No Gaps

The Stripe session data confirms the credit is working correctly:
- `amount_subtotal`: 6292 ($62.92 pre-credit)
- `amount_total`: 3792 ($37.92 after $25 coupon)
- `amount_discount`: 2500

Zinc `max_price` uses `line_items.subtotal` (product cost only), unaffected by credits. The pipeline is correctly wired.

### Fix

**`supabase/functions/ecommerce-email-orchestrator/index.ts`** — Line 1677

Change the `customerName` resolution to prefer the **buyer's profile name** over the shipping address name:

```
Current (line 1677):
  const customerName = shippingAddress?.name || 'Customer';

New logic:
  // Prefer buyer's profile name for the greeting (shipping name may be the gift recipient)
  let customerName = 'Customer';
  if (order.user_id) {
    const { data: buyerProfile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', order.user_id)
      .single();
    if (buyerProfile) {
      customerName = [buyerProfile.first_name, buyerProfile.last_name].filter(Boolean).join(' ') || shippingAddress?.name || 'Customer';
    }
  } else {
    customerName = shippingAddress?.name || 'Customer';
  }
```

This reuses the same `profiles` lookup already done 10 lines later (line 1689) for the gift-detection heuristic. We can consolidate both into a single query.

### Result

- Authenticated buyers see "Hi Justin" (from their profile)
- Guest buyers see the shipping address name (fallback)
- One file changed, ~8 lines

