

## Bloat Audit

Yes, there is accumulated debug bloat. Here's what I found and what the revised plan looks like:

### Current Bloat

**`processInviteReferral.ts`** — 6 debug toasts with 30-second durations, dynamic import of `sonner` at runtime. These are leftover from the debugging loop and will be removed entirely.

**`SteppedAuthFlow.tsx`** — 5 debug toasts/console.logs across two call sites (OAuth path line 365, email path lines 442-456). Also leftover debugging artifacts.

### What the Edge Function Replaces

The current `processInviteReferral.ts` does 5 separate client-side calls:
1. `sendConnectionRequest` (which itself does `getUser()` + insert)
2. `acceptConnectionRequest` (update)
3. `get_remaining_invites` RPC
4. `beta_referrals` insert
5. `ecommerce-email-orchestrator` invoke

The new edge function consolidates all 5 into one server-side call. The utility becomes a thin wrapper — roughly 15 lines instead of 100.

### Revised Plan (Lean Version)

**1. New edge function: `process-invite-referral/index.ts`** (~80 lines)
- Accepts `{ inviter_id, referred_id, referred_email }`
- Uses service role to: insert connection, check invite cap, insert referral, send email
- Single atomic operation, no RLS dependency

**2. Rewrite `processInviteReferral.ts`** (~15 lines)
- Remove all debug toasts, sonner import, and client-side connection logic
- Single `supabase.functions.invoke("process-invite-referral", { body })` call
- Clean up localStorage in finally block

**3. Clean up `SteppedAuthFlow.tsx`**
- Remove all 5 debug toasts/logs (lines 365, 443, 448, 451, 455)
- Keep the two `processInviteReferral` call sites (OAuth + email paths) — they're necessary
- Remove the `if/else` debug branching around `emailInviteUserId`, simplify to just call the utility

### Files Changed

| File | Change |
|------|--------|
| `supabase/functions/process-invite-referral/index.ts` | New ~80-line edge function |
| `src/utils/processInviteReferral.ts` | Rewrite from ~100 lines to ~15 lines |
| `src/components/auth/stepped/SteppedAuthFlow.tsx` | Remove debug artifacts only |

### Net Result
- Client code shrinks from ~100 lines to ~15
- All debug toasts removed
- Server function is self-contained and testable
- No over-engineering — this is the minimal fix for the RLS/session root cause

