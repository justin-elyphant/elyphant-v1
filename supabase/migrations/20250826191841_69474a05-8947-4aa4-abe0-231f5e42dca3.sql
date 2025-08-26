-- Insert the missing special date record for Dua Lipa with the correct user_id
INSERT INTO public.user_special_dates (user_id, date_type, date, visibility)
VALUES (
  '54087479-29f1-4f7f-afd0-cbdc31d6fb91', -- Dua Lipa's correct user_id
  'birthday',
  '2025-08-28',
  'friends'
)
ON CONFLICT (user_id, date_type) DO UPDATE SET
  date = EXCLUDED.date,
  visibility = EXCLUDED.visibility;