-- Allow null recipient_id for pending auto gifting rules
ALTER TABLE auto_gifting_rules ALTER COLUMN recipient_id DROP NOT NULL;

-- Update the foreign key constraint to allow NULL  
ALTER TABLE auto_gifting_rules DROP CONSTRAINT auto_gifting_rules_recipient_id_fkey;
ALTER TABLE auto_gifting_rules ADD CONSTRAINT auto_gifting_rules_recipient_id_fkey 
    FOREIGN KEY (recipient_id) REFERENCES profiles(id) ON DELETE CASCADE;