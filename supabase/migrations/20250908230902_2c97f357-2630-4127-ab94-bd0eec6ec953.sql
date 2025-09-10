-- Fix user deletion issue by removing blocking user_presence record and updating constraint

-- First, delete the user_presence record that's blocking the deletion
DELETE FROM public.user_presence 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'justin@remotelee.com'
);

-- Drop the existing foreign key constraint
ALTER TABLE public.user_presence 
DROP CONSTRAINT IF EXISTS user_presence_user_id_fkey;

-- Recreate the constraint with ON DELETE CASCADE
ALTER TABLE public.user_presence 
ADD CONSTRAINT user_presence_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;