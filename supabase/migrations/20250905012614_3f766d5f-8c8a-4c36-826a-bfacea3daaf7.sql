-- FINAL EMERGENCY FIX: Remove ALL remaining dangerous policies

-- Remove the service role policy that allows unrestricted access
DROP POLICY IF EXISTS "service_role_system_access" ON public.profiles;

-- Fix the insert policy that has no qualifier (allows anyone to insert)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Recreate the insert policy with proper security
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Ensure only authenticated users can perform operations
-- Remove any policies that don't require authentication
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Find and drop any remaining policies with 'true' qualifier or no qualifier
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND schemaname = 'public'
        AND (qual = 'true' OR qual IS NULL)
        AND policyname != 'Users can insert their own profile'  -- We just fixed this one
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "%s" ON public.profiles', policy_record.policyname);
    END LOOP;
END $$;

-- Final verification - this should now return SECURE status
SELECT emergency_security_verification() as final_security_check;