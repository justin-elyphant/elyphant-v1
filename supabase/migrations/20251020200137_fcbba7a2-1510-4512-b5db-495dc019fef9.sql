-- Fix foreign key constraints to allow cascading deletes for tables that actually exist

-- Drop and recreate user_addresses foreign key with CASCADE
ALTER TABLE user_addresses 
DROP CONSTRAINT IF EXISTS user_addresses_user_id_fkey;

ALTER TABLE user_addresses
ADD CONSTRAINT user_addresses_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;

-- Drop and recreate user_special_dates foreign key with CASCADE
ALTER TABLE user_special_dates 
DROP CONSTRAINT IF EXISTS user_special_dates_user_id_fkey;

ALTER TABLE user_special_dates
ADD CONSTRAINT user_special_dates_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;