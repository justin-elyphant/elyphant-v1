-- CRITICAL SECURITY FIX: Restrict access to elyphant_amazon_credentials table
-- This table contains sensitive encrypted passwords and must be protected

-- Drop the overly permissive existing policy
DROP POLICY IF EXISTS "Service role can manage Elyphant credentials" ON public.elyphant_amazon_credentials;

-- Create secure policies that only allow service role access
-- Policy 1: Only service role can read credentials
CREATE POLICY "Service role can read Elyphant credentials" 
ON public.elyphant_amazon_credentials 
FOR SELECT 
TO service_role 
USING (true);

-- Policy 2: Only service role can insert credentials
CREATE POLICY "Service role can insert Elyphant credentials" 
ON public.elyphant_amazon_credentials 
FOR INSERT 
TO service_role 
WITH CHECK (true);

-- Policy 3: Only service role can update credentials
CREATE POLICY "Service role can update Elyphant credentials" 
ON public.elyphant_amazon_credentials 
FOR UPDATE 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Policy 4: Only service role can delete credentials
CREATE POLICY "Service role can delete Elyphant credentials" 
ON public.elyphant_amazon_credentials 
FOR DELETE 
TO service_role 
USING (true);

-- Ensure RLS is enabled (should already be enabled)
ALTER TABLE public.elyphant_amazon_credentials ENABLE ROW LEVEL SECURITY;

-- Revoke any public access that might exist
REVOKE ALL ON public.elyphant_amazon_credentials FROM public;
REVOKE ALL ON public.elyphant_amazon_credentials FROM authenticated;
REVOKE ALL ON public.elyphant_amazon_credentials FROM anon;