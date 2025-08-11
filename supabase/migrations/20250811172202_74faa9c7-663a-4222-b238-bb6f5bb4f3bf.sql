-- Comprehensive Security Fix: Lock Down Profiles Table Completely
-- Remove ALL unauthorized access including read-only users

-- First, revoke all existing permissions from all roles except service_role
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.profiles FROM public;
REVOKE ALL ON public.profiles FROM authenticated;
REVOKE ALL ON public.profiles FROM supabase_read_only_user;

-- Disable and re-enable RLS to ensure clean state
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "authenticated_user_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "authenticated_user_view_permitted" ON public.profiles;
DROP POLICY IF EXISTS "service_role_full_access" ON public.profiles;

-- Grant minimal necessary permissions only to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

-- Create restrictive RLS policies
-- Policy 1: Authenticated users can only access their own profile
CREATE POLICY "user_own_profile_only"
ON public.profiles
FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 2: Authenticated users can view other profiles ONLY if privacy allows
CREATE POLICY "user_view_permitted_profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  auth.uid() != id AND 
  can_view_profile(id) = true
);

-- Policy 3: Service role access for system operations
CREATE POLICY "service_role_system_access"
ON public.profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Ensure the security is bulletproof by explicitly denying anon access
CREATE POLICY "deny_anonymous_access"
ON public.profiles
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Double-check by ensuring no default permissions
ALTER DEFAULT PRIVILEGES FOR ROLE postgres REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres REVOKE ALL ON TABLES FROM public;