

## Diagnosis

### Issue 1: Onboarding data not saved to profile

The `SteppedAuthFlow.handleComplete()` (line 277-279) does a `supabase.from("profiles").upsert(profileData)` right after `signUp()`. The problem is **timing**: when `signUp()` creates the user, Supabase's `handle_new_user` trigger likely creates a profile row first. Then the `upsert` runs — but the newly created user's session may not yet be fully established (email confirmation pending), so RLS policies on the `profiles` table likely **block the upsert silently**.

The code logs `profileError` on line 282 but doesn't throw — it continues to the success toast regardless. So the user sees "Account created!" but the profile data (dob, interests, address, etc.) was never actually written.

Additionally, the `data_sharing_settings` and `gift_preferences` fields are JSON objects/arrays being passed directly. If the `handle_new_user` trigger creates a row with `birth_year` defaulting (it's required/non-nullable), the upsert might conflict.

**Fix**: After `signUp()`, the upsert should use the service role or an RPC to ensure the profile data is written regardless of session state. The simplest client-side fix is to:
1. Wait briefly for the session to establish after signup
2. Use `supabase.auth.getSession()` to confirm the session exists before upserting
3. If the upsert fails, retry with a delay
4. Alternatively, create an RPC (`complete_onboarding`) that runs as `SECURITY DEFINER` to bypass RLS

### Issue 2: Welcome email never triggered

The `SteppedAuthFlow.handleComplete()` never enqueues a welcome email. Looking at the codebase:
- The orchestrator supports `welcome_email` event type
- Other flows have comments like "Welcome email functionality removed - email queue will handle welcome messages"  
- But **nothing in the stepped auth flow actually inserts into `email_queue`**

**Fix**: After successful profile creation in `handleComplete()`, insert a row into `email_queue` with `event_type: 'welcome_email'` — or invoke the orchestrator directly. Since email_queue inserts happen server-side in other flows, the best approach is to call `supabase.functions.invoke('ecommerce-email-orchestrator')` with the welcome email data.

## Plan

### 1. Create `complete-onboarding` RPC (database migration)
Create a `SECURITY DEFINER` function `complete_onboarding` that:
- Accepts user_id and all profile fields (name, dob, interests, address, etc.)
- Upserts the profile row bypassing RLS
- Inserts a welcome email into `email_queue`
- Returns success/failure

This solves both problems in a single atomic server-side call.

### 2. Update `SteppedAuthFlow.tsx` — `handleComplete()`
Replace the client-side `supabase.from("profiles").upsert(...)` with `supabase.rpc("complete_onboarding", { ... })`. This ensures:
- Profile data is saved reliably (bypasses RLS timing issues)
- Welcome email is queued atomically in the same call
- No new client-side code for email queuing

### 3. No other file changes needed
The orchestrator already handles `welcome_email` event type. The `process-email-queue` already processes the queue. Everything downstream is already wired.

### Technical Details

**RPC function** (`complete_onboarding`):
```sql
CREATE OR REPLACE FUNCTION public.complete_onboarding(
  p_user_id UUID,
  p_first_name TEXT,
  p_last_name TEXT,
  p_email TEXT,
  p_username TEXT,
  p_dob TEXT,
  p_birth_year INT,
  p_interests JSONB,
  p_gift_preferences JSONB,
  p_data_sharing_settings JSONB,
  p_shipping_address JSONB,
  p_profile_image TEXT DEFAULT NULL,
  p_user_type TEXT DEFAULT 'shopper'
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, first_name, last_name, name, username, email, dob, birth_year, interests, gift_preferences, data_sharing_settings, shipping_address, profile_image, user_type, onboarding_completed, updated_at)
  VALUES (p_user_id, p_first_name, p_last_name, p_first_name || ' ' || p_last_name, p_username, p_email, p_dob, p_birth_year, p_interests, p_gift_preferences, p_data_sharing_settings, p_shipping_address, p_profile_image, p_user_type, true, now())
  ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    name = EXCLUDED.name,
    username = EXCLUDED.username,
    email = EXCLUDED.email,
    dob = EXCLUDED.dob,
    birth_year = EXCLUDED.birth_year,
    interests = EXCLUDED.interests,
    gift_preferences = EXCLUDED.gift_preferences,
    data_sharing_settings = EXCLUDED.data_sharing_settings,
    shipping_address = EXCLUDED.shipping_address,
    profile_image = COALESCE(EXCLUDED.profile_image, profiles.profile_image),
    user_type = EXCLUDED.user_type,
    onboarding_completed = true,
    updated_at = now();

  -- Queue welcome email
  INSERT INTO email_queue (recipient_email, recipient_name, event_type, template_variables, status, scheduled_for)
  VALUES (
    p_email,
    p_first_name,
    'welcome_email',
    jsonb_build_object('first_name', p_first_name, 'email', p_email, 'gifting_url', 'https://elyphant.ai'),
    'pending',
    now()
  );

  RETURN true;
END;
$$;
```

**SteppedAuthFlow.tsx change** — in `handleComplete()`, replace lines 248-283 (the profileData construction + upsert) with a single `supabase.rpc("complete_onboarding", {...})` call using the same state values. The OAuth branch (lines 175-203) gets a similar replacement.

