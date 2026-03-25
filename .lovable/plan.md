

## Beta Credit System + 3 Email Templates in Orchestrator

### Summary

Build the full $100 store credit system with Trunkline approval gate, and add three new email templates to the ecommerce-email-orchestrator:

1. **Internal alert** → `justin@elyphant.com` when a new referral arrives needing approval
2. **Beta invite welcome** → sent to the invitee, prompting them to sign up
3. **Beta approved + credit issued** → sent after admin approval, with their $100 credit details and beta tester instructions

### Database (Migration)

**New table: `beta_credits`**
- `id`, `user_id` (FK profiles), `amount` (numeric, +/-), `type` (issued/spent/refunded), `description`, `order_id` (FK orders, nullable), `referral_id` (FK beta_referrals, nullable), `issued_by` (uuid nullable), `created_at`
- RLS: users read own rows, employees read/insert/update all

**New function: `get_beta_credit_balance(uuid)`** — returns `COALESCE(SUM(amount), 0)` from `beta_credits`

**Alter `beta_referrals`**: Add `pending_approval` as default status (instead of `pending`). Update the existing trigger so it creates the referral row with `status = 'pending_approval'` and does NOT auto-issue credits yet.

**New function: `approve_beta_referral(referral_uuid)`** — SECURITY DEFINER function that:
1. Updates `beta_referrals` status to `credit_issued`
2. Inserts a +$100 row into `beta_credits` for the referred user
3. Returns success

### Email Templates (3 new event types in orchestrator)

All three follow the existing Lululemon-inspired aesthetic (weight 300 headings, #1a1a1a buttons, 1px bordered cards, no emojis in subjects).

**`beta_approval_needed`** (internal alert)
- Sent to: `justin@elyphant.com` (hardcoded)
- Subject: "New Beta Tester Pending Approval — [invitee name/email]"
- Body: who referred whom, link to Trunkline Beta Program tab
- Triggered: when the referral trigger fires (connection accepted → referral created with `pending_approval`)

**`beta_invite_welcome`** (to invitee)
- Subject: "You're Invited to the Elyphant Beta"
- Body: welcome copy, explanation of the $100 credit they'll receive once approved, CTA to sign up
- Triggered: when an invitation is sent (reuse existing `connection_invitation` flow or fire separately)

**`beta_approved`** (to approved tester)
- Subject: "Welcome to the Elyphant Beta — Your $100 Credit is Ready"
- Body: thank you, $100 credit confirmation, what they need to do as testers (make purchases, test gifting, share feedback), how credits work across multiple orders
- Triggered: when admin clicks "Approve" in Trunkline and `approve_beta_referral` succeeds

### Trunkline Beta Program Tab (rewrite `TrunklineReferralsTab.tsx`)

**Section 1 — Referral Chain**
- Table with referrer, invitee, status badge (`pending_approval` → `credit_issued` → active)
- "Approve" button (calls `approve_beta_referral` RPC, which issues credit + triggers `beta_approved` email)
- "Reject" button with optional notes
- Remove old "Mark as Paid" flow

**Section 2 — Beta Tester Balances**
- Table: tester name/email, credit issued, credit spent, remaining balance, # orders
- Click to expand credit transaction history

**Section 3 — Summary Stats**
- Total testers, total credits issued, total spent, remaining liability, orders by beta testers

**Sidebar**: Rename "Referrals" → "Beta Program"

### Checkout Integration

**`create-checkout-session`**:
- After auth, call `get_beta_credit_balance(user.id)`
- If balance > 0: reduce Stripe amount by `min(balance, total)`
- If fully covered: skip Stripe, create order with `payment_status = 'paid_by_credits'`, invoke `process-order-v2`
- Store `beta_credits_applied` in session metadata

**`stripe-webhook-v2`**:
- Read `beta_credits_applied` from metadata
- Insert negative `beta_credits` row for the amount used

**Frontend checkout UI**:
- Show "Beta Credit: $XX.XX available" line item when balance > 0
- Show applied discount and adjusted "You Pay" total

### Frontend Hook

**`src/hooks/useBetaCredits.ts`** — queries `beta_credits` for current user, returns `{ balance, isLoading, refetch }`

### Trigger Flow

```text
1. User A invites User B via connections
2. User B signs up, accepts invitation
3. Trigger fires → creates beta_referral (status: pending_approval)
4. Trigger also fires beta_approval_needed email → justin@elyphant.com
5. Justin opens Trunkline → Beta Program → clicks "Approve"
6. approve_beta_referral() → inserts +$100 credit, updates status
7. beta_approved email fires → User B gets welcome + credit details
8. User B shops → checkout applies credit as discount
```

### Files Affected

- **Migration**: `beta_credits` table, `get_beta_credit_balance`, `approve_beta_referral`, alter referral trigger
- **Edit**: `supabase/functions/ecommerce-email-orchestrator/index.ts` — add 3 templates + 3 event type cases
- **Rewrite**: `src/components/trunkline/TrunklineReferralsTab.tsx` → Beta Program dashboard with approve/reject
- **Edit**: `src/components/trunkline/TrunklineSidebar.tsx` — rename nav item
- **Edit**: `supabase/functions/create-checkout-session/index.ts` — credit balance check + discount
- **Edit**: `supabase/functions/stripe-webhook-v2/index.ts` — deduct credits post-payment
- **Create**: `src/hooks/useBetaCredits.ts`
- **Edit**: Checkout UI component — show credit balance line item

### Stripe

No additional Stripe configuration needed. Credits are applied as a reduced charge amount — Stripe just sees a lower (or $0) total.

### Note on `beta_invite_welcome`

The existing `connection_invitation` email already fires when someone is invited. The new `beta_invite_welcome` can either replace that for beta invites or be sent alongside it. Recommendation: enhance the existing invitation template to mention the $100 credit when the referrer is a beta participant, rather than sending two separate emails.

