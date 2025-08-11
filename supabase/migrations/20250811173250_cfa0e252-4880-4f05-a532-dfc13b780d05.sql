-- Fix API Key Access for Edge Functions
-- Allow service_role to access API keys for system operations
-- Grant service_role access to api_keys table
GRANT ALL ON public.api_keys TO service_role;

-- Create policy for service role access to API keys
CREATE POLICY "service_role_api_key_access"
ON public.api_keys
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Ensure there's a system-accessible API key
-- Check if we have an API key with a system user_id or create one if needed
DO $$
DECLARE
    system_user_id UUID := '00000000-0000-0000-0000-000000000000';
    api_key_exists BOOLEAN;
BEGIN
    -- Check if system API key exists
    SELECT EXISTS(
        SELECT 1 FROM public.api_keys 
        WHERE user_id = system_user_id
    ) INTO api_key_exists;
    
    -- If no system API key exists and there are user API keys, 
    -- update one to be system accessible
    IF NOT api_key_exists THEN
        UPDATE public.api_keys 
        SET user_id = system_user_id 
        WHERE id = (SELECT id FROM public.api_keys LIMIT 1);
        
        RAISE LOG 'Updated existing API key to be system accessible';
    END IF;
END $$;