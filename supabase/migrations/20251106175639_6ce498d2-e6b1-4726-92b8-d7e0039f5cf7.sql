-- Add gift preview tracking columns to orders table
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS thank_you_sent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS thank_you_sent_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS gift_preview_viewed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS gift_preview_viewed_at TIMESTAMP WITH TIME ZONE;

-- Create gift preview tokens table for secure access
CREATE TABLE IF NOT EXISTS gift_preview_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  recipient_email TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 days'),
  viewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT valid_token CHECK (length(token) >= 32)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_gift_preview_tokens_token ON gift_preview_tokens(token);
CREATE INDEX IF NOT EXISTS idx_gift_preview_tokens_order ON gift_preview_tokens(order_id);
CREATE INDEX IF NOT EXISTS idx_gift_preview_tokens_expires ON gift_preview_tokens(expires_at);

-- Enable RLS on gift_preview_tokens
ALTER TABLE gift_preview_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone with valid token can view (no auth required)
CREATE POLICY "Gift preview tokens are publicly accessible via token"
  ON gift_preview_tokens
  FOR SELECT
  USING (expires_at > now());

-- Comment on table for documentation
COMMENT ON TABLE gift_preview_tokens IS 'Secure tokens for gift recipients to preview their gifts without authentication';