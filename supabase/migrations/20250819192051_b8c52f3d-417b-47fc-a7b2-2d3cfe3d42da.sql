-- Remove ALL existing policies that might conflict
DROP POLICY IF EXISTS "user_view_permitted_profiles" ON profiles;
DROP POLICY IF EXISTS "user_own_profile_only" ON profiles;
DROP POLICY IF EXISTS "Allow profile viewing" ON profiles;

-- Create a single, comprehensive policy for profile access
CREATE POLICY "profiles_select_policy" 
ON profiles FOR SELECT 
USING (true);

-- Ensure we can also insert/update profiles for authenticated users
CREATE POLICY "profiles_insert_policy" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_policy" 
ON profiles FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Keep service role access
-- (service_role_system_access policy should remain)