-- Fix user_type for justin@elyphant.com to be employee
UPDATE public.profiles 
SET user_type = 'employee'::user_type, 
    signup_source = 'trunkline'::signup_source,
    updated_at = now()
WHERE email = 'justin@elyphant.com';