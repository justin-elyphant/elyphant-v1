-- Clean up all data referencing the duplicate profile '019f8d3b-8531-4f9e-8a9d-02eeea5fdfa3'

-- Delete user addresses
DELETE FROM public.user_addresses 
WHERE user_id = '019f8d3b-8531-4f9e-8a9d-02eeea5fdfa3';

-- Delete user connections
DELETE FROM public.user_connections 
WHERE user_id = '019f8d3b-8531-4f9e-8a9d-02eeea5fdfa3' 
   OR connected_user_id = '019f8d3b-8531-4f9e-8a9d-02eeea5fdfa3';

-- Delete auto gifting rules
DELETE FROM public.auto_gifting_rules 
WHERE user_id = '019f8d3b-8531-4f9e-8a9d-02eeea5fdfa3' 
   OR recipient_id = '019f8d3b-8531-4f9e-8a9d-02eeea5fdfa3';

-- Delete auto gifting settings
DELETE FROM public.auto_gifting_settings 
WHERE user_id = '019f8d3b-8531-4f9e-8a9d-02eeea5fdfa3';

-- Delete wishlists
DELETE FROM public.wishlists 
WHERE user_id = '019f8d3b-8531-4f9e-8a9d-02eeea5fdfa3';

-- Delete gift searches
DELETE FROM public.gift_searches 
WHERE user_id = '019f8d3b-8531-4f9e-8a9d-02eeea5fdfa3';

-- Delete any other user-specific data that might reference this profile
DELETE FROM public.user_special_dates 
WHERE user_id = '019f8d3b-8531-4f9e-8a9d-02eeea5fdfa3';

DELETE FROM public.privacy_settings 
WHERE user_id = '019f8d3b-8531-4f9e-8a9d-02eeea5fdfa3';

-- Finally, delete the duplicate profile
DELETE FROM public.profiles 
WHERE id = '019f8d3b-8531-4f9e-8a9d-02eeea5fdfa3';

-- Ensure the remaining profile has the correct type
UPDATE public.profiles 
SET profile_type = 'employee'
WHERE id = '155db0e0-73f1-4fef-bb1e-8d9091d5f91a'
AND email = 'justin@elyphant.com';