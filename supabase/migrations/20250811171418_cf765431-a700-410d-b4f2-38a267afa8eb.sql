-- Final Security Fix: Completely Remove All Anonymous Access to Profiles
-- The previous fix may not have been sufficient - ensuring complete security

-- Check for and remove any remaining anonymous access policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Allow public read access" ON public.profiles;
DROP POLICY IF EXISTS "Public read access" ON public.profiles;
DROP POLICY IF EXISTS "Allow anonymous access" ON public.profiles;

-- Disable RLS temporarily to recreate clean policies
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS with strict authentication requirement
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Remove all existing policies to start clean
DROP POLICY IF EXISTS "Users can access their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view permitted profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;

-- Create new secure policies with explicit authentication requirements
-- Policy 1: Only authenticated users can access their own profile
CREATE POLICY "authenticated_user_own_profile"
ON public.profiles
FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 2: Only authenticated users can view other profiles based on privacy settings
CREATE POLICY "authenticated_user_view_permitted"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  auth.uid() != id AND 
  can_view_profile(id) = true
);

-- Policy 3: Service role maintains system access
CREATE POLICY "service_role_full_access"
ON public.profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Ensure no default grants exist that would allow anonymous access
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.profiles FROM public;