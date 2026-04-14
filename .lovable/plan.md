<final-text>
## Minimal fix plan

I checked the live database definitions, not just the repo.

### What I confirmed
- `assign_default_customer_role()` is already fixed live and now uses `'shopper'::public.app_role`.
- So the earlier enum fix was real, but it is not the only failing function.

### Do I know what the issue is?
Yes. The current signup error is still database-side, not OAuth/UI complexity.

Two live functions are still using `SET search_path TO ''` while referencing public objects without schema qualification:

1. `public.link_pending_auto_gift_rules()`
   - currently uses `user_connections` and `auto_gifting_rules`
   - should use `public.user_connections` and `public.auto_gifting_rules`
   - this fires on `AFTER INSERT ON public.profiles`, which happens during `supabase.auth.signUp`, so it can still cause the password-step failure

2. `public.complete_onboarding()`
   - currently uses `profiles`, `email_queue`, and `::user_type`
   - should use `public.profiles`, `public.email_queue`, and `::public.user_type`
   - this will likely be the next blocker even after signup is unblocked

### What I will change
Create one small SQL migration only:
- replace `public.link_pending_auto_gift_rules()` with schema-qualified table names
- replace `public.complete_onboarding()` with schema-qualified table/type names
- keep all existing onboarding and OAuth behavior exactly the same

### What I will not change
- no OAuth flow rewrite
- no new auth-state abstraction
- no frontend step changes
- no extra complexity

### Why this is the minimal fix
The failure is happening inside the database trigger/function chain during account creation. Fixing those two functions addresses the actual source without touching the client flow.

### After the migration
I’ll verify:
1. email signup succeeds past the password step
2. onboarding completes on the final step
3. `profiles`, `user_roles`, and `privacy_settings` rows exist for the new user
4. OAuth resume still lands in the same stepped flow without any logic changes

### Technical details
Broken pattern:
```sql
SECURITY DEFINER
SET search_path TO ''
...
UPDATE user_connections ...
INSERT INTO profiles ...
VALUES (..., p_user_type::user_type, ...)
```

Fixed pattern:
```sql
SECURITY DEFINER
SET search_path TO ''
...
UPDATE public.user_connections ...
INSERT INTO public.profiles ...
VALUES (..., p_user_type::public.user_type, ...)
```
</final-text>