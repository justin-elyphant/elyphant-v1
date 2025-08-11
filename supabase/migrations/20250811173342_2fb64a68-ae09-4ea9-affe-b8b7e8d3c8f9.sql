-- Fix API Key Access for Edge Functions - Alternative Approach
-- Allow service_role to access API keys for system operations
GRANT ALL ON public.api_keys TO service_role;

-- Create policy for service role access to API keys
CREATE POLICY "service_role_api_key_access"
ON public.api_keys
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);