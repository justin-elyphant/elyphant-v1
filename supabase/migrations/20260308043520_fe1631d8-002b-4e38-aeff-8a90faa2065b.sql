
-- Delete all public schema data for the test vendor user so auth.users cascade delete works
DELETE FROM public.vendor_accounts WHERE user_id = '7e9da1d2-0ae4-44bb-9db9-046045c49f55';
DELETE FROM public.user_sessions WHERE user_id = '7e9da1d2-0ae4-44bb-9db9-046045c49f55';
DELETE FROM public.security_logs WHERE user_id = '7e9da1d2-0ae4-44bb-9db9-046045c49f55';
DELETE FROM public.profiles WHERE id = '7e9da1d2-0ae4-44bb-9db9-046045c49f55';
