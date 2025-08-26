-- Update the existing rule to use 'just_because' event type
UPDATE public.auto_gifting_rules 
SET date_type = 'just_because'
WHERE id = '35d1cc15-4c88-431d-a080-7bbfbc99bdf4' 
  AND user_id = '0478a7d7-9d59-40bf-954e-657fa28fe251'
  AND date_type = 'other';