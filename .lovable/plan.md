
The user wants me to be lean — fix the actual broken thing (status constraint mismatch) without spawning new components, new helpers, or duplicate ledger paths. Re-use what exists.

## Scope check — what's already built (reuse, don't recreate)

- `process_auto_approved_referral` RPC — already does seeder detection, cap check, pool check, ledger insert. **Keep as-is.**
- `useBetaCredits` hook — already gates CTA + checkout. **Keep as-is.**
- `processInviteReferral` util + `process-invite-referral` edge function — already the single attribution entrypoint. **Keep, just fix the status string.**
- `beta_credits` ledger — already supports `issued`/`spent`/`refunded`. **Keep types as-is; the RPC writes `issued`, not `welcome`.**
- Trunkline admin UI — already reads the same tables. **No changes needed.**

## Minimal fix (no new code, no new types)

The only real bug: `process-invite-referral` inserts `status = 'approved'` but the DB constraint doesn't allow it. The RPC then never runs, so no credit is issued, so the CTA + $25 discount stay hidden.

### Step 1 — DB migration (additive, one constraint)
Update `beta_referrals_status_check` to allow the statuses the existing code already uses:
- `pending`, `pending_approval`, `signed_up`, `credit_issued`, `cap_reached`, `rejected`, `reward_paid`

**Do NOT** add a new `welcome` credit type. The RPC already writes `type='issued'` — that's fine, reuse it.

### Step 2 — Fix `process-invite-referral` edge function
- Replace the invalid `status: 'approved'` insert with `status: 'signed_up'` (valid transitional state).
- Then call existing `process_auto_approved_referral` RPC — it handles everything (seeder skip, cap, pool, credit insert, final status).
- Only send `beta_approval_needed` email when auto-approve setting is actually OFF — not on insert failure.

### Step 3 — Force balance refresh post-onboarding
After `processInviteReferral` resolves in `SteppedAuthFlow.tsx`, invalidate the `["beta-credit-balance"]` query so the new user sees the CTA without a manual refresh. One line.

### What I'm explicitly NOT doing
- Not adding a new `welcome` credit type (RPC already uses `issued`).
- Not creating new components, new hooks, or new admin tables.
- Not touching analytics RPC (it already counts `issued` which is what the RPC writes).
- Not refactoring Trunkline.

### Files touched
1. New SQL migration — extend `beta_referrals_status_check` only.
2. `supabase/functions/process-invite-referral/index.ts` — fix status string + email-gating logic.
3. `src/utils/processInviteReferral.ts` — invalidate beta-credit-balance query on success.

### Re-test (Larry's case)
- Manually backfill Larry: insert his `beta_referrals` row with `status='signed_up'` and call the RPC so he gets his $100 without needing a re-invite.
- Then verify CTA appears and checkout shows up to −$25.
