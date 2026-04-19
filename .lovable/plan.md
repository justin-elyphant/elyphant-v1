

## Findings

The **code is already correct** — both the CTA buttons and the referral RPC reflect the policy "only the invitee gets $100, the inviter gets nothing extra":

- `ConnectionsHeroSection.tsx` line 96 → "Give a Friend $100" ✓
- `UserButton.tsx` lines 272 & 453 → "Give a Friend $100" ✓
- Hero paragraph → "Share your link and give a friend $100 when they join." ✓
- `process_auto_approved_referral` RPC → only inserts `welcome` credit for invitee, no referrer reward ✓

The user's screenshots show stale copy ("Invite a Friend, Get $100" / "earn $100 for every friend who joins") — these strings **no longer exist anywhere in the codebase**. The screenshots are from the previously-deployed build, taken before the last set of edits propagated.

## Remaining stale copy to fix

Three leftover issues to clean up:

### 1. Hero subhead grammar (already correct in code, but worth tightening)
Current: "Share your link and give a friend **$100** when they join."
This is correct and matches policy. No change needed.

### 2. Welcome onboarding email — `ecommerce-email-orchestrator/index.ts` line 1409
> "Share your invite link (you get 2 invites) so you can test gifting to each other. **They'll each get $100 in credit too.**"

This is correct (each invitee gets $100). No change needed.

### 3. Stale code comment — `src/utils/processInviteReferral.ts` line 30
```
// "Invite Friends, Get $100" CTA + checkout discount appear immediately.
```
Comment references old CTA name. Cosmetic only — update to "Give a Friend $100" for clarity.

## Action plan

**Step 1 — Clarify with user:** The screenshots show old copy that no longer exists in the codebase. This is likely a stale published build. Ask whether they want me to trigger a republish, or whether they're seeing this on a different surface I haven't found yet.

**Step 2 — Cosmetic comment fix:**
- Update the stale comment in `src/utils/processInviteReferral.ts` line 30.

**Step 3 — Confirm policy in memory:**
- Update `mem://social/beta/budget-and-caps` to explicitly state: "Referrer receives NO credit. Only the invitee receives $100 welcome credit." This locks in the current policy so no future change reintroduces the doubled credit.

**Files touched:** 1 code file (cosmetic), 1 memory file. No DB migrations, no new components.

