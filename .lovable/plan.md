

## Fix Dashboard Numbers + Automate Stripe Payout Tracking

### Problem 1: Dashboard Net Revenue is wrong

The `extractGiftingFee` function divides by 100 (line 20: `return Number(lineItems.gifting_fee) / 100`), assuming values are stored in cents. But the actual DB data shows gifting fees stored in **dollars** (e.g., `3.35`, `4.2`, `2.0`). This is why Net Revenue shows $0.85 instead of ~$84.56, and Gross Profit shows "Price not available" (it goes deeply negative).

**Fix**: Remove the `/100` division in `extractGiftingFee`. The gifting_fee in `line_items` JSONB is already in dollars.

### Problem 2: Stripe payouts not tracked

You receive daily Stripe payout emails ($100.19, $91.45, $26.09, $64.61...) but the `zma_funding_schedule` table is empty. The funding flow is: Stripe → Chase → PayPal → Zinc ZMA. The dashboard needs to:

1. **Pull Stripe payout history** so you can see what's landing in Chase
2. **Calculate the Elyphant fee deduction** — only the product cost portion should transfer to ZMA, not the gifting fee (that's your revenue to keep)
3. **Show the net transfer amount** per payout

### Plan

**1. Fix `extractGiftingFee` in OverviewTab.tsx**
Remove the `/100` division on lines 20 and 25. Values are already in dollars.

**2. Create a `get-stripe-payouts` edge function**
Call `stripe.payouts.list()` to fetch recent payouts with amounts, dates, and status. Return them as JSON. This replaces manual tracking — you can see exactly what Stripe is sending to Chase each day.

**3. Add a Stripe Payouts section to MonthlyFundingDashboard**
Replace the static "Monthly Funding Checklist" with a live **Stripe Payouts → ZMA Transfer** workflow:
- Table of recent Stripe payouts (date, amount, status, payout ID)
- For each payout, show a calculated breakdown:
  - **Payout amount** (from Stripe)
  - **Elyphant fees retained** (sum of gifting_fees from orders in that payout period)
  - **Net to transfer to ZMA** = Payout - Fees retained
- A "Record Transfer" action per payout row that creates a `zma_funding_schedule` entry with `stripe_payout_id`, `transfer_amount` (net), and `total_markup_retained`

**4. Update TransferCalculator to use real payout data**
Instead of just comparing pending orders vs balance, also show:
- Recent Stripe payouts arriving in Chase (with dates)
- Suggested transfer = sum of untransferred payouts minus retained fees

### Files affected
- **Edit**: `src/components/trunkline/dashboard/OverviewTab.tsx` — fix `/100` bug
- **Create**: `supabase/functions/get-stripe-payouts/index.ts` — list recent payouts
- **Edit**: `src/components/trunkline/funding/MonthlyFundingDashboard.tsx` — add payouts table + transfer workflow
- **Edit**: `src/components/trunkline/funding/TransferCalculator.tsx` — incorporate payout data
- **Deploy**: `get-stripe-payouts`

### What stays unchanged
- ZMA balance polling, audit log, TransferHistory component
- Order pipeline visualization
- All order processing / fulfillment logic

