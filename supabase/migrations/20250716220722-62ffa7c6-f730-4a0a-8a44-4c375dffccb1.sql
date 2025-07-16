-- Fix Charles Meeks event data consistency
-- Link the Charles Meeks event to his connection record
UPDATE user_special_dates 
SET connection_id = 'aea12b29-b643-41b3-967f-ca7796fb6a7a'
WHERE id = '993bacb3-0fd0-4f4b-a9a1-e8ad8e16bf8e';

-- Update the auto_gifting_rule for Charles to have the correct email and link to birthday events
UPDATE auto_gifting_rules 
SET pending_recipient_email = 'charles_test1@gmail.com',
    date_type = 'birthday'
WHERE id = 'ad59fcf6-fac5-4d63-b86c-6de95f9f783a';