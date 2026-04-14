

# Fix: "Account creation failed" — app_role Type Not Found

## Root Cause

The `assign_default_customer_role()` trigger fires after every new profile INSERT. It contains:

```sql
VALUES (NEW.id, 'shopper'::app_role)
```

But the function is declared with `SET search_path TO ''` (empty search path for security). This means Postgres cannot resolve the unqualified `app_role` type, causing:

```
ERROR: type "app_role" does not exist (SQLSTATE 42704)
```

This aborts the entire signup transaction — no profile is created, no confirmation email is sent.

## Fix

One SQL migration to schema-qualify the type reference:

```sql
CREATE OR REPLACE FUNCTION public.assign_default_customer_role()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'shopper'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$function$;
```

The only change is `'shopper'::app_role` → `'shopper'::public.app_role`.

## Impact
- Fixes all new user signups (email and OAuth)
- No frontend changes needed
- The two-phase onboarding code is working correctly — it was properly surfacing this database error at the password step instead of silently failing at the photo step

## Files Changed
- One database migration only

