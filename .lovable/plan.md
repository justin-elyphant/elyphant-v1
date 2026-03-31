

## Option A: Conditional Email Swap — Yes, This Sets You Up Well

### Why It Works for Both Phases

**Phase 1 (Now — Beta, 10-20 testers, $100 credit):**
The invite flow in `AddConnectionSheet.tsx` currently sends `connection_invitation` to every invitee. With Option A, we add a simple check: "Is this inviter a beta tester?" If yes, send `beta_invite_welcome` (which mentions the $100 credit) instead of the generic `connection_invitation`.

**Phase 2 (Production — 30% off gifting fee for referrals):**
You'd add a third email template (e.g., `referral_invite`) and extend the same conditional routing: beta tester → `beta_invite_welcome`, regular user → `referral_invite` (mentioning 30% off), no program → standard `connection_invitation`. The routing logic is already in place — you just add another branch.

### What Changes

**One file**: `src/components/connections/AddConnectionSheet.tsx`

The current code (line 99-111) always fires `connection_invitation`. We replace it with:

```text
if inviter has beta credits → fire beta_invite_welcome
else → fire connection_invitation (standard)
```

The check is simple: query `beta_credits` for the current user. If they have a balance, they're a beta tester.

**Also fire from**: `PendingTabContent.tsx` (resend button) and `UnifiedGiftManagementService.ts` (gift invitations) — same conditional swap so the beta messaging is consistent everywhere invitations are sent.

### Technical Detail

- Query the `get_beta_credit_balance` RPC for the current user on mount or before sending
- Pass the result into the email routing conditional
- `beta_invite_welcome` template already exists in the orchestrator and mentions the $100 credit
- No new templates, no orchestrator changes — just wiring the trigger

### Files Affected

- **Edit**: `src/components/connections/AddConnectionSheet.tsx` — conditional email swap
- **Edit**: `src/components/connections/PendingTabContent.tsx` — same swap for resend
- **Optional**: `src/services/UnifiedGiftManagementService.ts` — same swap for gift-based invites

