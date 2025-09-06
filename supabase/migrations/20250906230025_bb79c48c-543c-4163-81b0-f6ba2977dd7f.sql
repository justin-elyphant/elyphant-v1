-- Update the auto-gift rule with a past date to have a future date
UPDATE auto_gifting_rules 
SET scheduled_date = '2025-09-15'
WHERE id = '35d1cc15-4c88-431d-a080-7bbfbc99bdf4' 
AND scheduled_date = '2025-08-28';