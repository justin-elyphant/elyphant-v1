# Future Enhancement: Elyphant Gift Credit

## Concept

Users purchase Elyphant credit as a gift for someone else to spend on the platform. Instead of picking a specific product, the gifter selects a dollar amount and a recipient — the recipient receives spendable credit in their account.

## Existing Infrastructure to Leverage

- **`beta_credits` table** — Already serves as a transaction ledger with `type`, `amount`, `user_id`, `order_id` columns
- **`get_beta_credit_balance` RPC** — Sums credits/debits per user; works unchanged for gift credits
- **`create-checkout-session`** — Already deducts credit balance server-side before charging Stripe
- **`stripe-webhook-v2`** — Already creates orders from session metadata; can branch on a new `gift_credit` type
- **`useBetaCredits` hook** — Frontend balance display; works unchanged

## Stripe Flow

1. Gifter selects amount ($25, $50, $100, custom) and picks a recipient (connection or email)
2. Frontend calls `create-checkout-session` with metadata: `{ type: "gift_credit", recipient_user_id, credit_amount }`
3. Stripe Checkout Session created as a **digital product** — no shipping address collected, no Zinc involvement
4. On `checkout.session.completed` webhook:
   - Insert a `gift_credit` row into `beta_credits` for the **recipient** with positive amount
   - Optionally insert a `gift_credit_purchase` row for the **gifter** (audit trail, zero balance impact)
   - Send notification to recipient ("You received $X in Elyphant credit from [Gifter Name]!")

## Zinc Integration

- **At purchase time**: No Zinc involvement — this is a digital transaction
- **At redemption time**: Recipient shops normally; credit is deducted during checkout (already wired via `create-checkout-session` credit logic); Zinc fulfills physical goods as usual

## Key Changes Needed

1. **New transaction type** — Add `gift_credit` to the ledger (currently only `beta_signup`, `beta_referral`, `spend`)
2. **Gift Credit purchase UI** — Amount selector ($25/$50/$100/custom), recipient picker (from connections or enter email)
3. **Digital-only checkout session** — Skip shipping address collection; pass `gift_credit` metadata
4. **Webhook handler branch** — In `stripe-webhook-v2`, detect `type: "gift_credit"` in metadata and deposit credit to recipient
5. **Recipient notification** — Email + in-app notification: "You received $X in Elyphant credit!"
6. **Configurable per-order cap** — Current `BETA_CREDIT_PER_ORDER_CAP = 25` needs to become configurable or removed for general gift credits
7. **Gift credit balance UI** — Recipient sees combined balance (beta + gift credits) — already works since `get_beta_credit_balance` sums all types

## Revenue Model

- Elyphant keeps float on unspent credits (cash in bank, liability on books)
- Drives platform retention — recipients must return to spend credits
- Potential for expiration policy (e.g., 12-month expiry) to reduce liability

## Priority

Low — bank for post-launch. Current beta credit system proves the mechanics work.
