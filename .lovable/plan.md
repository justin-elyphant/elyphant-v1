

## Plan: Fix Beta Referral Action Buttons and Unknown Tester Names

### Issue 1: No Approve/Reject Buttons
The referral record for Justin → Heather was inserted with `status: 'pending'`, but the UI only shows action buttons when status is `pending_approval` or `signed_up`. The status `pending` doesn't match either condition.

**Fix**: Two changes needed:
1. **Database migration**: Update the existing referral record's status from `pending` to `pending_approval`
2. **`src/pages/AuthCallback.tsx`**: Change the status used when inserting new referral records from `'pending'` to `'pending_approval'` so future referrals show action buttons immediately

Also update the `pendingApproval` counter (line 259) and the action button condition (line 403) in `TrunklineReferralsTab.tsx` to also match `'pending'` as a safety net.

### Issue 2: "Unknown" Names in Beta Tester Balances
The profile lookup at line 211-222 queries `profiles` with `.in("id", creditUserIds)`. While Justin has a `business_admin` role that should allow viewing all profiles, the query may be returning empty rows due to the `is_business_admin` function using `SECURITY INVOKER` context.

**Fix**: The `get_beta_tester_analytics` RPC function (which is `SECURITY DEFINER`) already fetches profile data correctly. For the Tester Balances section, the simplest fix is to make the profile lookup in the component more resilient — but first, the actual root cause is likely that the `creditProfiles` query silently returns no rows because RLS blocks it in some edge case.

A more robust approach: use a `SECURITY DEFINER` RPC function to fetch beta tester profiles, bypassing RLS for this admin-only page. Alternatively, add `'pending'` to the status match so the referral chain lookup also resolves names.

### Files to Modify
1. **New SQL migration** -- Update existing referral status from `'pending'` to `'pending_approval'`
2. **`src/pages/AuthCallback.tsx`** -- Change inserted status from `'pending'` to `'pending_approval'`
3. **`src/components/trunkline/TrunklineReferralsTab.tsx`** -- Add `'pending'` to the status conditions for action buttons and pending counter (defensive fix)

### Technical Detail
- Line 259: Add `|| r.status === "pending"` to the pending count filter
- Line 403: Add `|| r.status === "pending"` to the action button condition
- The "Unknown" names should resolve once the referral status matches and the referral chain lookup finds Heather's profile via `referred_profile`; for non-referral testers (manual credits), the `creditProfiles` query should work since Justin is a business admin

