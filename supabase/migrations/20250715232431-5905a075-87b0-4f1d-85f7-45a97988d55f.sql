-- Allow null connected_user_id for pending invitations
ALTER TABLE user_connections ALTER COLUMN connected_user_id DROP NOT NULL;

-- Update the foreign key constraint to allow NULL
ALTER TABLE user_connections DROP CONSTRAINT user_connections_connected_user_id_fkey;
ALTER TABLE user_connections ADD CONSTRAINT user_connections_connected_user_id_fkey 
    FOREIGN KEY (connected_user_id) REFERENCES profiles(id) ON DELETE CASCADE;