-- Create bidirectional connection records for existing connections
-- This ensures that when user A connects to user B, both directions exist:
-- 1. user_id = A, connected_user_id = B (A is connected to B)
-- 2. user_id = B, connected_user_id = A (B is connected to A)

-- Insert missing bidirectional records for accepted connections
INSERT INTO public.user_connections (
  user_id, 
  connected_user_id, 
  status, 
  relationship_type,
  data_access_permissions,
  created_at,
  updated_at
)
SELECT DISTINCT
  uc.connected_user_id as user_id,
  uc.user_id as connected_user_id,
  uc.status,
  uc.relationship_type,
  '{}'::jsonb as data_access_permissions, -- Default to no restrictions (all data allowed)
  uc.created_at,
  uc.updated_at
FROM public.user_connections uc
WHERE uc.status = 'accepted'
  AND NOT EXISTS (
    -- Check if the reverse connection already exists
    SELECT 1 FROM public.user_connections uc2
    WHERE uc2.user_id = uc.connected_user_id
      AND uc2.connected_user_id = uc.user_id
  );

-- Create a function to automatically create bidirectional records for new connections
CREATE OR REPLACE FUNCTION public.create_bidirectional_connection()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create the reverse connection if this is a new accepted connection
  -- and the reverse doesn't already exist
  IF NEW.status = 'accepted' AND (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status != 'accepted')) THEN
    INSERT INTO public.user_connections (
      user_id,
      connected_user_id,
      status,
      relationship_type,
      data_access_permissions,
      created_at,
      updated_at
    )
    SELECT
      NEW.connected_user_id,
      NEW.user_id,
      NEW.status,
      NEW.relationship_type,
      '{}'::jsonb, -- Default to no restrictions
      NOW(),
      NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_connections
      WHERE user_id = NEW.connected_user_id
        AND connected_user_id = NEW.user_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER ensure_bidirectional_connections
  AFTER INSERT OR UPDATE ON public.user_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.create_bidirectional_connection();