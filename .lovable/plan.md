

## Complete Beta Credit System — Email Templates, Checkout Integration, and Trigger Wiring

### What's done
- Database: `beta_credits` table, `get_beta_credit_balance`, `approve_beta_referral`, `reject_beta_referral` — all migrated
- Trunkline Beta Program tab: approval queue, tester balances, manual credit issuance, fires `beta_approved` email on approve
- Sidebar renamed to "Beta Program"
- `useBetaCredits` hook created
- Orchestrator switch: 3 beta event types registered

### What's broken / missing

The orchestrator switch calls `betaApprovalNeededTemplate()`, `betaInviteWelcomeTemplate()`, and `betaApprovedTemplate()` — but these functions were never written. Any beta email event will crash at runtime. Checkout has zero credit logic. No code fires the internal alert or invite welcome emails.

### Plan

**Step 1 — Add 3 email template functions to the orchestrator**

All three use the existing `baseEmailTemplate` wrapper, `fontStack`, and `getFirstName` utilities. Same Lululemon-inspired aesthetic: weight 300 headings, `#1a1a1a` buttons, 1px bordered cards, uppercase 13px labels, no emojis in subjects.

- `betaApprovalNeededTemplate(data)` — Internal alert to `justin@elyphant.com`. Shows referrer name/email, invitee name/email, CTA button linking to Trunkline Beta Program tab.
- `betaInviteWelcomeTemplate(data)` — To the invitee. Welcome copy explaining the $100 credit they'll get once approved. CTA to sign up at `elyphant.ai/signup`.
- `betaApprovedTemplate(data)` — To the approved tester. $100 credit confirmation, instructions (make purchases, test gifting, share feedback, credits work across multiple orders). CTA to start shopping.

**Step 2 — Wire `beta_approval_needed` trigger**

In `TrunklineReferralsTab.tsx`, after a referral is created with `pending_approval` status, the internal alert should fire. Since the referral trigger runs in the DB, the most reliable place is to fire this email from the approve flow's "pending" detection — or better, from the connection acceptance handler. However, the simplest approach: fire `beta_approval_needed` from the Trunkline tab when it detects new `pending_approval` referrals on load (or from the connection acceptance flow in `AddConnectionSheet`). I'll wire it from the connection acceptance flow where the referral trigger fires.

**Step 3 — Wire `beta_invite_welcome` trigger**

In the invitation flow (when a user sends a connection invitation via `AddConnectionSheet` or equivalent), fire `beta_invite_welcome` to the invitee alongside the existing `connection_invitation` email. Check if the sender is a beta participant before sending.

**Step 4 — Checkout credit integration**

- `create-checkout-session/index.ts`: After auth, call `get_beta_credit_balance`. If balance > 0, reduce Stripe `amountInCents`. If fully covered, create order directly with `payment_status = 'paid_by_credits'` and invoke `process-order-v2`. Store `beta_credits_applied` in Stripe session metadata.
- `stripe-webhook-v2/index.ts`: Read `beta_credits_applied` from metadata, insert negative `beta_credits` row.
- `CheckoutSummary.tsx`: Import `useBetaCredits`, show "Beta Credit" line item with discount applied.

**Step 5 — Deploy orchestrator**

Redeploy `ecommerce-email-orchestrator`, `create-checkout-session`, and `stripe-webhook-v2`.

### Files affected

- **Edit**: `supabase/functions/ecommerce-email-orchestrator/index.ts` — add 3 template functions before the `getEmailTemplate` switch
- **Edit**: `supabase/functions/create-checkout-session/index.ts` — credit balance check + discount + `paid_by_credits` path
- **Edit**: `supabase/functions/stripe-webhook-v2/index.ts` — deduct credits post-payment
- **Edit**: `src/components/checkout/CheckoutSummary.tsx` — show beta credit line item
- **Edit**: Connection acceptance flow — fire `beta_approval_needed` and `beta_invite_welcome` emails
- **Deploy**: All 3 edge functions

