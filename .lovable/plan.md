

## Fix: Beta referral attribution missing after onboarding

### Root Cause

When a user signs up via `/invite/justin`, the `InvitePage` stores `elyphant_invite_user` in localStorage and redirects to `/auth?invite_user=<id>&mode=signup`. The stepped onboarding flow runs on that page. But when onboarding completes, `SteppedAuthFlow.tsx` calls `navigate("/home")` directly (lines 363, 428), **bypassing** the post-signup linking logic in `Auth.tsx` that creates the connection and referral record.

The result: no `user_connections` record, no `beta_referrals` record, no admin notification.

### Fix

**File: `src/components/auth/stepped/SteppedAuthFlow.tsx`** (2 changes)

1. Before the `navigate("/home")` calls at lines 363 and 428, add the invite-link auto-connect and beta referral creation logic:
   - Read `elyphant_invite_user` from localStorage
   - If present and different from current user:
     - Call `sendConnectionRequest` + `acceptConnectionRequest` (auto-connect)
     - Insert into `beta_referrals` with `status: 'pending_approval'` and `reward_amount: 100`
     - Check `get_remaining_invites` RPC to respect invite caps
     - Trigger `beta_approval_needed` email via `ecommerce-email-orchestrator`
     - Clean up localStorage keys
   - This mirrors the exact logic from `AuthCallback.tsx` lines 74-156

2. Extract the shared referral-processing logic into a reusable utility (optional but recommended):
   - Create `src/utils/processInviteReferral.ts` with a single function
   - Have both `SteppedAuthFlow.tsx` and `AuthCallback.tsx` call it
   - Eliminates code duplication and future drift

### Data Integrity

- The `beta_referrals` insert uses the same fields: `referrer_id`, `referred_id`, `referred_email`, `connection_id`, `status`, `reward_amount`
- The invite cap check (`get_remaining_invites`) prevents over-issuing credits
- Birthday data write-back is unaffected (handled by `complete_onboarding` RPC)

### Files Changed

| File | Change |
|------|--------|
| `src/utils/processInviteReferral.ts` | New utility: shared invite auto-connect + referral creation |
| `src/components/auth/stepped/SteppedAuthFlow.tsx` | Call the new utility before `navigate("/home")` |
| `src/pages/AuthCallback.tsx` | Refactor to use the shared utility (reduce duplication) |

