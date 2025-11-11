-- Add missing accepted_at column to user_connections
ALTER TABLE public.user_connections
ADD COLUMN IF NOT EXISTS accepted_at timestamptz;

-- Create partial unique index to support ON CONFLICT and prevent duplicate connections
CREATE UNIQUE INDEX IF NOT EXISTS ux_user_connections_pair
ON public.user_connections (user_id, connected_user_id)
WHERE connected_user_id IS NOT NULL;