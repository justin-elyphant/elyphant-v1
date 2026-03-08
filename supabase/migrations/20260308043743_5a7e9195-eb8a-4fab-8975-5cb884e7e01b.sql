
-- Clean up ALL remaining references for test vendor user 7e9da1d2-0ae4-44bb-9db9-046045c49f55
DELETE FROM public.security_logs WHERE user_id = '7e9da1d2-0ae4-44bb-9db9-046045c49f55';
DELETE FROM public.user_sessions WHERE user_id = '7e9da1d2-0ae4-44bb-9db9-046045c49f55';
DELETE FROM public.user_roles WHERE user_id = '7e9da1d2-0ae4-44bb-9db9-046045c49f55';
DELETE FROM public.privacy_settings WHERE user_id = '7e9da1d2-0ae4-44bb-9db9-046045c49f55';
DELETE FROM public.user_presence WHERE user_id = '7e9da1d2-0ae4-44bb-9db9-046045c49f55';
