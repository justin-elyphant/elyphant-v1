-- Remove the duplicate 'giftor' profile for justin@elyphant.com user
-- Keep only the 'employee' profile
DELETE FROM public.profiles 
WHERE id = '019f8d3b-8531-4f9e-8a9d-02eeea5fdfa3' 
AND profile_type = 'giftor';

-- Ensure the remaining profile has the correct type
UPDATE public.profiles 
SET profile_type = 'employee'
WHERE id = '155db0e0-73f1-4fef-bb1e-8d9091d5f91a'
AND email = 'justin@elyphant.com';

-- Add unique constraint to prevent future email duplicates
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_email_unique 
UNIQUE (email);