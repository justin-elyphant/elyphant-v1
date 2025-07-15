-- Add pending connection support to user_connections table
ALTER TABLE user_connections ADD COLUMN IF NOT EXISTS pending_recipient_email TEXT;
ALTER TABLE user_connections ADD COLUMN IF NOT EXISTS pending_recipient_name TEXT;
ALTER TABLE user_connections ADD COLUMN IF NOT EXISTS pending_shipping_address JSONB;
ALTER TABLE user_connections ADD COLUMN IF NOT EXISTS invitation_sent_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE user_connections ADD COLUMN IF NOT EXISTS invitation_token TEXT UNIQUE;

-- Update status enum to include 'pending_invitation'
ALTER TABLE user_connections DROP CONSTRAINT IF EXISTS user_connections_status_check;
ALTER TABLE user_connections ADD CONSTRAINT user_connections_status_check 
CHECK (status IN ('pending', 'accepted', 'blocked', 'pending_invitation'));

-- Add index for invitation tokens
CREATE INDEX IF NOT EXISTS idx_user_connections_invitation_token ON user_connections(invitation_token);

-- Add function to generate invitation tokens
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Add trigger to auto-generate invitation tokens for pending invitations
CREATE OR REPLACE FUNCTION set_invitation_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pending_invitation' AND NEW.invitation_token IS NULL THEN
    NEW.invitation_token := generate_invitation_token();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_invitation_token
  BEFORE INSERT OR UPDATE ON user_connections
  FOR EACH ROW
  EXECUTE FUNCTION set_invitation_token();

-- Update auto_gifting_rules to support pending recipients
ALTER TABLE auto_gifting_rules ADD COLUMN IF NOT EXISTS pending_recipient_email TEXT;

-- Create pending gift invitations table for tracking
CREATE TABLE IF NOT EXISTS pending_gift_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  shipping_address JSONB,
  invitation_token TEXT NOT NULL UNIQUE,
  gift_events JSONB DEFAULT '[]'::jsonb,
  auto_gift_rules JSONB DEFAULT '[]'::jsonb,
  invitation_sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days'),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on pending_gift_invitations
ALTER TABLE pending_gift_invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies for pending_gift_invitations
CREATE POLICY "Users can manage their own gift invitations"
ON pending_gift_invitations
FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Public can view invitations by token"
ON pending_gift_invitations
FOR SELECT
USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_pending_gift_invitations_updated_at
  BEFORE UPDATE ON pending_gift_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();