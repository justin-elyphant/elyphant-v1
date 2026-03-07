

## Bank Dispute/Refund & Shipping Rate Strategy to plan.md

**What:** Append two new strategic sections before the "Completed Plans" heading (line 388).

### Section 1: Dispute & Refund Handling Strategy

- **Elyphant mediates all refunds** — as the Stripe account owner, Elyphant controls the refund flow for brand consistency
- **Amazon-fulfilled orders:** Recipients use Amazon's gift receipt return process directly (already documented in platform memory)
- **Vendor-fulfilled orders:** Elyphant receives the refund request → notifies vendor → vendor handles physical return logistics → Elyphant issues Stripe refund once confirmed
- **Vendor portal shows read-only "Returns & Refunds" list** — status, reason, payout deduction impact; vendors cannot initiate refunds themselves
- **Vendor payout deductions** — refund amounts are deducted from vendor's next settlement; vendors see this in their earnings dashboard
- **Disputes (chargebacks):** Elyphant handles all Stripe disputes; vendor is notified but does not interact with Stripe directly

### Section 2: Shipping Rate Strategy

- **Shopify-synced products:** Elyphant sets its own shipping rates (flat-rate tiers or free-shipping thresholds) — do NOT pull Shopify shipping rates to maintain pricing control and avoid sync complexity
- **Vendor-direct (platform-exclusive) products:** Vendors define shipping in a simple config (flat rate per product or free shipping) within their product form or vendor settings
- **Amazon/Zinc-fulfilled products:** Shipping is baked into the product price (existing behavior, no change)
- **Future consideration:** Weight-based or zone-based shipping calculator — not needed for MVP, revisit when order volume justifies it

