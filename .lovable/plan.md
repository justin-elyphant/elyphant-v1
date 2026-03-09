

# Vendor Login Gaps for Heather

## Gap 1: Email Confirmation Could Block Login (HIGH RISK)
When Heather signed up via the vendor application, `supabase.auth.signUp()` was called. If Supabase has email confirmations enabled (which it likely does based on the `ProfileGuard` checking `email_confirmed_at`), Heather's account won't have `email_confirmed_at` set until she clicks the verification link in her email.

However, the `emailRedirectTo` in the vendor signup points to `/vendor-portal` — so when she clicks the verification link, she lands back at the vendor login/apply page. That part is fine.

**The problem**: The signup flow immediately calls `supabase.auth.signOut()` after creating the account. If Heather never clicked the email verification link before you approved her, her `signInWithPassword` call will fail with "Email not confirmed." The vendor login handler does catch this message (line 68), but **Heather may not have received or clicked the verification email**, especially since the application confirmation email (from the orchestrator) is a separate email from the Supabase verification email.

**Fix**: Either (a) disable email confirmation for vendor signups, or (b) add a "Resend verification email" option on the vendor login form, or (c) have the `approve-vendor` edge function auto-confirm the vendor's email using the admin API when approving.

## Gap 2: Login Redirects to `/vendor-management` Instead of `/vendor`
In `VendorPortalAuth.tsx` line 85, after a successful login with a valid vendor role, the code navigates to `/vendor-management`. The route in `App.tsx` (line 275) redirects `/vendor-management` → `/vendor`. This works but is an unnecessary redirect hop. Not a blocker, but sloppy.

## Gap 3: ProfileGuard Could Intercept Vendor Routes
The `/vendor` route uses `VendorPortalLayout` which wraps children in `VendorGuard` — this is good. However, if Heather navigates to any shopper-facing route that's wrapped in `ProfileGuard`, she'll be blocked because her profile likely doesn't have all mandatory fields (profile_image, username, DOB, etc.). The vendor signup only creates basic profile fields via `handle_new_user()`.

This isn't a direct login gap since vendor routes use `VendorGuard` not `ProfileGuard`, but if Heather accidentally hits a shopper route while authenticated, she'd get stuck in profile completion flow.

## Gap 4: `useUserContext` Could Block Access in VendorGuard
`VendorGuard` (line 28) checks `if (userContext && !isVendor)` and denies access with "not-vendor." The `isVendor` flag comes from `useUserContext`. If that hook checks `profile_type` on the profiles table, and the `handle_new_user` trigger correctly set it to `'vendor'`, this should work. But if the profile_type wasn't set correctly (e.g., if `user_type` wasn't in the metadata), Heather would be denied even after approval.

## Recommended Fix (Priority Order)

1. **Auto-confirm email on approval** — In the `approve-vendor` edge function, use the Supabase Admin API to call `auth.admin.updateUserById(vendorUserId, { email_confirm: true })` when approving. This eliminates the email verification blocker entirely.

2. **Add resend verification link** — On the vendor Sign In tab, add a "Resend verification email" link that appears when login fails with the "Email not confirmed" error.

3. **Clean up redirect** — Change line 85 in `VendorPortalAuth.tsx` from `/vendor-management` to `/vendor`.

## Technical Details

### Files to modify:
- `supabase/functions/approve-vendor/index.ts` — Add `supabaseAdmin.auth.admin.updateUserById(vendor.user_id, { email_confirm: true })` after approval status update
- `src/components/vendor/auth/VendorPortalAuth.tsx` — Fix redirect path (line 85), optionally add resend verification UI

### No database changes needed.

