-- Insert the missing special date record for Dua Lipa to enable auto-gifting processing
INSERT INTO public.user_special_dates (user_id, date_type, date, visibility)
VALUES (
  'ca8f23b6-7d13-4894-bc6c-2c6d24c3f7a8', -- Dua Lipa's user_id
  'birthday',
  '2025-08-28',
  'friends'
)
ON CONFLICT (user_id, date_type) DO UPDATE SET
  date = EXCLUDED.date,
  visibility = EXCLUDED.visibility;