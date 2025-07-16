-- Update the existing Christmas event to link to Jack's connection instead of Charles's
UPDATE user_special_dates 
SET connection_id = '0d7b09e2-6a6b-467a-b736-d42e8796cf72'
WHERE user_id = 'dac7fb50-3cbd-4e0a-b20f-3749e877242d' 
  AND date_type = 'christmas';