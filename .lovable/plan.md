

## Beta Program Production Audit — Findings & Fix Plan

### Summary

The beta program is mostly well-wired. I found **1 critical bug**, **2 moderate issues**, and **4 minor gaps** that should be addressed before inviting testers.

---

### Critical: `beta_approved` template reads wrong field name

**The bug:** The `betaApprovedTemplate` function (line 1308) reads `props.tester_name` to extract the first name:
```
const firstName = getFirstName(props.tester_name);
```
But every caller passes `recipient_name` instead:
- **Trunkline approval** (line 115): sends `{ recipient_name: ..., credit_amount: ... }`
- **Manual credit issuance** (line 180): sends `{ recipient_name: ..., credit_amount: ... }`
- **Test email sample data** (line 201): sends `{ customer_name: "Sarah Chen", first_name: "Sarah" }`

**Result:** Every beta approval email renders as *"Welcome to the beta, ."* with a blank name.

**Fix:** Change `props.tester_name` to `props.recipient_name` in the template, and align the test sample data to use `recipient_name`.

---

### Moderate Issues

**1. `beta_checkin` missing from `TestEmailModal` sample data**

The `beta_checkin` event is registered in `EmailTemplatesManager.tsx` (with `sampleData`) but has no matching entry in `TestEmailModal.tsx`'s `getSampleDataForEvent()`. Clicking "Send Test" for the weekly check-in will send an email with all fields undefined/empty.

**Fix:** Add `beta_checkin` sample data to `getSampleDataForEvent()` in `TestEmailModal.tsx`.

**2. `beta_approval_needed` sample data uses wrong field names**

`TestEmailModal.tsx` sends `{ applicant_name, applicant_email, referrer_name }` but the template reads `{ invitee_name, invitee_email, referrer_name, referrer_email }`. The test preview will show "Unknown" / "N/A" for the invitee fields.

**Fix:** Align sample data keys: `invitee_name`, `invitee_email`, `referrer_name`, `referrer_email`.

---

### Minor Gaps

**3. Feedback page accessible without auth — by design, but no rate limiting**

The `validate_beta_feedback_token` and `submit_beta_feedback` RPCs are `SECURITY DEFINER` and callable by `anon`. This is correct for the token-gated flow, but means anyone with a valid token URL can submit. Tokens are single-use and time-limited (7 days), which is adequate protection. No action needed, but worth noting.

**4. `beta-checkin-emailer` uses `APP_URL` env var**

The edge function defaults to `https://elyphant.lovable.app` if `APP_URL` isn't set. For production (`elyphant.ai`), this should be set as a Supabase secret so feedback links point to the correct domain.

**Fix:** Add `APP_URL` secret set to `https://elyphant.ai` in Supabase Edge Function secrets.

**5. Trunkline "Review in Trunkline" CTA in `beta_approval_needed` email links to `elyphant.ai/trunkline?tab=referrals`**

This URL structure may not match the actual routing (`/trunkline/referrals`). Should verify and update if needed.

**Fix:** Update the CTA URL to `https://elyphant.ai/trunkline/referrals`.

**6. `beta_approved` sample data in `EmailTemplatesManager.tsx` also uses wrong field**

It sends `customer_name` and `first_name` but the template reads `tester_name` (which itself is wrong — see Critical above). After the critical fix, the sample data should send `recipient_name`.

---

### Files to edit

| File | Changes |
|------|---------|
| `supabase/functions/ecommerce-email-orchestrator/index.ts` | Line 1308: `props.tester_name` → `props.recipient_name`. Line 1243: update Trunkline CTA URL |
| `src/components/trunkline/communications/TestEmailModal.tsx` | Fix `beta_approved` sample data keys. Fix `beta_approval_needed` keys. Add `beta_checkin` entry |
| `src/components/trunkline/communications/EmailTemplatesManager.tsx` | Fix `beta_approved` sampleData to use `recipient_name` |

**Post-edit:** Redeploy `ecommerce-email-orchestrator` edge function.

### What's already wired correctly

- Invite flow: `AddConnectionSheet` correctly detects beta tester status, sends `beta_invite_welcome` to invitee + `beta_approval_needed` to admin
- Approval flow: Trunkline approve button calls RPC + fires `beta_approved` email (field name bug aside)
- Manual credit issuance: Works end-to-end with email trigger
- Feedback system: Token generation, validation, submission RPCs, and Trunkline viewer all properly connected
- Weekly cron: Configured in `config.toml` for Mondays 10 AM, edge function assembles personalized data correctly
- RLS: Feedback tables properly locked down with admin-only read access
- Email templates: All 4 beta templates registered in orchestrator switch statement and previewer

