

## Gaps Found + Issue Credit Modal Fix

### Identified Gaps

1. **Issue Credit modal has no first/last name fields** — only email. The tester shows as "Unknown / Unknown" because manual credits bypass the referral chain (no matching referral = no profile lookup for display).

2. **Issue Credit does NOT fire any email** — it just inserts a `beta_credits` row. No `beta_approved` or `beta_invite_welcome` email is triggered. The approve mutation (via referral queue) does fire `beta_approved`, but the manual "Issue Credit" path skips it entirely.

3. **Tester balance name resolution is broken for manual credits** — the `testerBalances` memo only looks up names from the referrals list (`referrals.find(r => r.referred_id === credit.user_id)`). If the credit was issued manually (no referral row), the tester shows "Unknown".

4. **No `beta_approval_needed` internal alert fires on manual issue** — the internal alert to `justin@elyphant.com` only fires from `AddConnectionSheet` (connection invitation flow), not from the Issue Credit modal.

### Plan

**Step 1 — Add first name + last name fields to Issue Credit modal**

Add `creditFirstName` and `creditLastName` state fields. Add two input fields above the email field in the dialog. These are used for display and passed to the email template.

**Step 2 — Fire `beta_approved` email from Issue Credit mutation**

After the credit insert succeeds, invoke `ecommerce-email-orchestrator` with `eventType: "beta_approved"`, passing the recipient email, name, and credit amount. This ensures the tester gets their welcome email regardless of whether they came through the referral queue or manual issuance.

**Step 3 — Fix tester name resolution for manual credits**

When building `testerBalances`, if no referral match is found, fall back to fetching the profile name/email from the `profiles` table. Since we already have the profile data from the issue credit lookup, we can also store the name in the `description` or use a separate profiles query. Simplest fix: run a secondary profiles query keyed by the unique user_ids in `allCredits` to populate names.

**Step 4 — Fire `beta_approval_needed` internal alert on manual issue (optional)**

Not needed for manual credits since you (the admin) are already in Trunkline issuing it. Skip this — only relevant for self-service referral signups.

### Files affected

- **Edit**: `src/components/trunkline/TrunklineReferralsTab.tsx`
  - Add `creditFirstName`, `creditLastName` state
  - Add name input fields to Issue Credit dialog
  - Fire `beta_approved` email after credit insert
  - Add profiles query for tester name resolution fallback

