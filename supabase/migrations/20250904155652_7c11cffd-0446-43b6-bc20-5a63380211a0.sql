-- Add emergency profile tracking for new/invited users
ALTER TABLE recipient_intelligence_profiles 
ADD COLUMN IF NOT EXISTS is_emergency_profile BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS invitation_context JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS proxy_intelligence JSONB DEFAULT NULL;

-- Add urgency tracking to automated gift executions  
ALTER TABLE automated_gift_executions
ADD COLUMN IF NOT EXISTS urgency_level INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS invitation_context JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS emergency_intelligence JSONB DEFAULT NULL;

-- Add invitation context cache table for rapid access
CREATE TABLE IF NOT EXISTS invitation_context_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  recipient_identifier TEXT NOT NULL,
  invitation_data JSONB NOT NULL DEFAULT '{}',
  relationship_context JSONB NOT NULL DEFAULT '{}',
  urgency_factors JSONB NOT NULL DEFAULT '{}',
  proxy_intelligence JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  UNIQUE(user_id, recipient_identifier)
);

-- Enable RLS for invitation context cache
ALTER TABLE invitation_context_cache ENABLE ROW LEVEL SECURITY;

-- RLS policy for invitation context cache
CREATE POLICY "Users can manage their own invitation context cache"
ON invitation_context_cache
FOR ALL
USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_invitation_context_cache_user_id ON invitation_context_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_invitation_context_cache_expires_at ON invitation_context_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_automated_gift_executions_urgency ON automated_gift_executions(urgency_level);
CREATE INDEX IF NOT EXISTS idx_recipient_intelligence_emergency ON recipient_intelligence_profiles(is_emergency_profile);

-- Create function to clean up expired invitation context cache
CREATE OR REPLACE FUNCTION cleanup_expired_invitation_cache()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM invitation_context_cache 
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;