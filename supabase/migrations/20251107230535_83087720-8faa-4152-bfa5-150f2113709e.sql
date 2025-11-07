-- Add columns to automated_gift_executions for pending recipient handling
ALTER TABLE automated_gift_executions
ADD COLUMN IF NOT EXISTS pending_recipient_email TEXT,
ADD COLUMN IF NOT EXISTS address_collection_token TEXT,
ADD COLUMN IF NOT EXISTS address_collection_status TEXT CHECK (address_collection_status IN ('not_needed', 'requested', 'received', 'expired')) DEFAULT 'not_needed';

-- Add columns to orders for smart delivery timing
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS hold_for_scheduled_delivery BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS zinc_scheduled_processing_date TIMESTAMPTZ;

-- Create pending_recipient_addresses table
CREATE TABLE IF NOT EXISTS pending_recipient_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES automated_gift_executions(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  shipping_address JSONB,
  collected_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for token lookups
CREATE INDEX IF NOT EXISTS idx_pending_recipient_addresses_token ON pending_recipient_addresses(token);
CREATE INDEX IF NOT EXISTS idx_pending_recipient_addresses_execution ON pending_recipient_addresses(execution_id);

-- Enable RLS on pending_recipient_addresses
ALTER TABLE pending_recipient_addresses ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own address requests
CREATE POLICY "Users can view their own address requests"
ON pending_recipient_addresses
FOR SELECT
USING (requested_by = auth.uid());

-- Policy: Anyone can submit address with valid token (for unauthenticated recipients)
CREATE POLICY "Anyone can update with valid token"
ON pending_recipient_addresses
FOR UPDATE
USING (token IS NOT NULL AND expires_at > now());

-- Policy: System can insert address requests
CREATE POLICY "System can insert address requests"
ON pending_recipient_addresses
FOR INSERT
WITH CHECK (true);

-- Add function to generate address collection token
CREATE OR REPLACE FUNCTION generate_address_collection_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
END;
$$;

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_pending_recipient_addresses_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_pending_recipient_addresses_updated_at
BEFORE UPDATE ON pending_recipient_addresses
FOR EACH ROW
EXECUTE FUNCTION update_pending_recipient_addresses_timestamp();