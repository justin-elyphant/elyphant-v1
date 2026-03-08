

## Fix: Vendor Signup Creates Shopper Profile

### Problem
Two issues with the current vendor application flow:

1. **`handle_new_user()` trigger** always sets `profile_type = 'customer'` for non-elyphant emails. It ignores the `user_type: 'vendor'` metadata passed during signup. This means every vendor gets a shopper profile.

2. **Vendor is auto-logged-in** after applying, landing them on the shopper dashboard before they're even approved.

### Changes

**1. SQL Migration — Update `handle_new_user()` trigger**

Add a check for `raw_user_meta_data->>'user_type' = 'vendor'` in the CASE expression:

```sql
CASE 
  WHEN new.email ILIKE '%@elyphant.com' THEN 'employee'
  WHEN new.raw_user_meta_data->>'user_type' = 'vendor' THEN 'vendor'
  ELSE 'customer'
END
```

This ensures vendor applicants get `profile_type = 'vendor'` from the start.

**2. Frontend — Sign out vendor after application (`VendorPortalAuth.tsx`)**

After successful signup, call `await supabase.auth.signOut()` before setting `submitted = true`. This prevents the vendor from being logged into the shopper experience. Their auth account exists but they can only access the vendor portal after admin approval.

**3. Frontend — Redirect to homepage while signed out**

The existing 5-second redirect to `/` will now correctly show the public homepage (since the user is signed out), not the shopper dashboard.

### Files Changed
- **New SQL migration** — one `CREATE OR REPLACE FUNCTION` for `handle_new_user()`
- **`src/components/vendor/auth/VendorPortalAuth.tsx`** — add `signOut()` call after successful signup

