

# Fix: Onboarding Data Not Persisting + Restore Address Verification

## Root Cause (Confirmed via DB reproduction)

The `complete_onboarding` RPC has been **silently failing for every user** since the `user_type` column was changed from `TEXT` to an `enum`. The RPC passes `p_user_type TEXT` but the column is `user_type` enum — Postgres throws:

```
column "user_type" is of type user_type but expression is of type text
```

I reproduced this by calling the RPC directly against a test user — it fails every time. The email signup path (line 277-279) catches the error but only `console.error`s it and still navigates to success. That's why users see "Account created!" but `onboarding_completed` stays `false` and all fields remain null.

**Evidence:** Zero rows in `email_queue` with `event_type = 'welcome_email'` — the RPC never reached the email insert because it fails on the profile upsert first.

## Fix 1: Repair the `complete_onboarding` RPC (database migration)

Cast `p_user_type` to the enum in the INSERT:

```sql
p_user_type::user_type
```

This is the only change needed in the function. Same ON CONFLICT logic, same email queue insert.

## Fix 2: Stop swallowing errors in `SteppedAuthFlow.tsx`

**File: `src/components/auth/stepped/SteppedAuthFlow.tsx`**

Line 277-279 currently:
```typescript
if (profileError) {
  console.error("Profile creation error:", profileError);
}
// still shows success toast and navigates!
```

Change to throw on error, blocking navigation and showing error feedback. Also add a post-save verification read-back to confirm `onboarding_completed = true` before navigating.

## Fix 3: Re-enable address verification in AddressStep

**File: `src/components/auth/stepped/steps/AddressStep.tsx`**

Currently passes `showVerification={false}` to `ShippingAddressForm`. Change to `showVerification={true}` so the `InlineAddressVerification` component renders — this is the blue checkmark system that validates addresses during signup. The component already exists and works; it was just disabled when the stepped modal was created.

## Summary of Changes

| File | Change |
|------|--------|
| **Database migration** | Fix `complete_onboarding` RPC: cast `p_user_type::user_type` |
| `src/components/auth/stepped/SteppedAuthFlow.tsx` | Throw on `profileError` instead of swallowing; add post-save verification |
| `src/components/auth/stepped/steps/AddressStep.tsx` | Set `showVerification={true}` to restore blue checkmark |

This is a minimal fix — no new logic, no refactoring. The existing address verification, data mapping, and settings display code all work correctly. The only problem was the RPC silently failing due to a type mismatch.

