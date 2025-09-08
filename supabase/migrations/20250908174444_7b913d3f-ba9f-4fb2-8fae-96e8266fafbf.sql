-- Fix Dua Lipa's incorrect birthday and add missing anniversary
-- First, get Dua's user ID
WITH dua_user AS (
  SELECT id FROM profiles WHERE email = 'dua_lipa2test@gmail.com'
)
-- Delete the incorrect August 28th birthday entry
DELETE FROM public.user_special_dates 
WHERE user_id = (SELECT id FROM dua_user) 
  AND date_type = 'birthday' 
  AND date = '2025-08-28';

-- Add the correct November 13th anniversary entry
INSERT INTO public.user_special_dates (user_id, date_type, date, title, description)
SELECT 
  id,
  'anniversary',
  '2024-11-13',
  'Anniversary',
  'Annual anniversary celebration'
FROM profiles 
WHERE email = 'dua_lipa2test@gmail.com'
ON CONFLICT (user_id, date_type, date) DO NOTHING;