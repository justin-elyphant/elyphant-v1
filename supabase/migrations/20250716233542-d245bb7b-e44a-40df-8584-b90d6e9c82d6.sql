-- Create Jack's Christmas event with the correct connection
INSERT INTO user_special_dates (
  user_id,
  connection_id, 
  date_type,
  date,
  is_recurring,
  recurring_type,
  visibility
) VALUES (
  'dac7fb50-3cbd-4e0a-b20f-3749e877242d',
  '0d7b09e2-6a6b-467a-b736-d42e8796cf72',
  'christmas',
  '2025-12-25',
  true,
  'yearly',
  'private'
);