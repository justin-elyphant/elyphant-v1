

## Plan: Fix Beta Program Analytics Error and Add Referral Notification Email

### Problem 1: "Failed to load analytics"
The `get_beta_tester_analytics()` database function has its `search_path` set to an empty string (`""`), so it cannot find any tables like `beta_credits`. This causes the RPC call to fail with "relation beta_credits does not exist."

**Fix**: Recreate the function with `SET search_path = 'public'` (quoted properly so Postgres stores it correctly).

### Problem 2: No email notification when a referral signs up
The `AuthCallback.tsx` creates the `beta_referrals` record correctly, but it never calls the email orchestrator with the `beta_approval_needed` event. The template exists in the orchestrator, and the trigger exists in `AddConnectionSheet.tsx` for manual invites, but the invite-link signup flow in `AuthCallback.tsx` is missing this trigger entirely.

**Fix**: After the `beta_referrals` insert succeeds in `AuthCallback.tsx`, invoke the `ecommerce-email-orchestrator` with `eventType: 'beta_approval_needed'` to email `justin@elyphant.com` with the referral details (referrer name, invitee name/email, credit amount).

### Files to Modify
1. **New SQL migration** -- Recreate `get_beta_tester_analytics()` with correct `search_path = 'public'`
2. **`src/pages/AuthCallback.tsx`** -- Add orchestrator email call after beta referral insert (lines ~92-104)

### Technical Detail
- The search_path fix requires quoting: `SET search_path = 'public'` to ensure Postgres stores the literal schema name
- The email trigger needs to fetch the referrer's profile (name, email) to populate the template before calling the orchestrator

