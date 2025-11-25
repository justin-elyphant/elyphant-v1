-- Clean up stuck user martyyy_smith_test123@gmail.com
-- Delete all blocking foreign key references

-- Delete email queue records
DELETE FROM email_queue WHERE recipient_email = 'martyyy_smith_test123@gmail.com';

-- Delete email analytics
DELETE FROM email_analytics WHERE recipient_email = 'martyyy_smith_test123@gmail.com';

-- Delete security logs (blocking foreign key)
DELETE FROM security_logs WHERE user_id = '3ce5afa2-d6e4-4ad3-84b5-833c83bbd6dc';

-- Now delete the auth user (all foreign key constraints should be resolved)
DELETE FROM auth.users WHERE email = 'martyyy_smith_test123@gmail.com';