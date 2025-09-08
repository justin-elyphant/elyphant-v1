-- Fix Dua Lipa's special dates data
-- Delete the incorrect August 28th birthday entry first
DELETE FROM public.user_special_dates 
WHERE user_id = (SELECT id FROM profiles WHERE email = 'dua_lipa2test@gmail.com') 
  AND date_type = 'birthday' 
  AND date = '2025-08-28';

-- Add the correct November 13th anniversary entry
INSERT INTO public.user_special_dates (user_id, date_type, date, visibility)
SELECT 
  id,
  'anniversary',
  '2024-11-13',
  'friends'
FROM profiles 
WHERE email = 'dua_lipa2test@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM user_special_dates 
    WHERE user_id = profiles.id 
      AND date_type = 'anniversary' 
      AND date = '2024-11-13'
  );