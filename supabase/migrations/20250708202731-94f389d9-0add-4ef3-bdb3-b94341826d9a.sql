-- Create tables for the Real Address Request System

-- Address requests table for tracking sent/received requests
CREATE TABLE address_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'expired', 'declined')),
  reminder_schedule TEXT NOT NULL DEFAULT '3_days' CHECK (reminder_schedule IN ('1_day', '3_days', '5_days', 'no_reminders')),
  include_notifications BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  fulfilled_at TIMESTAMP WITH TIME ZONE,
  shared_address JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trigger for updated_at
CREATE TRIGGER update_address_requests_updated_at
  BEFORE UPDATE ON address_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS policies for address requests
ALTER TABLE address_requests ENABLE ROW LEVEL SECURITY;

-- Users can create address requests
CREATE POLICY "Users can create address requests" ON address_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

-- Users can view requests they sent or received
CREATE POLICY "Users can view their address requests" ON address_requests
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

-- Users can update requests they received (for fulfillment)
CREATE POLICY "Recipients can fulfill address requests" ON address_requests
  FOR UPDATE USING (auth.uid() = recipient_id);

-- Users can delete requests they sent
CREATE POLICY "Requesters can delete their requests" ON address_requests
  FOR DELETE USING (auth.uid() = requester_id);

-- Create index for performance
CREATE INDEX idx_address_requests_recipient ON address_requests(recipient_id);
CREATE INDEX idx_address_requests_requester ON address_requests(requester_id);
CREATE INDEX idx_address_requests_status ON address_requests(status);
CREATE INDEX idx_address_requests_expires_at ON address_requests(expires_at);