-- Phase 4: Birthday Email System - Database Migration
-- Create birthday email tracking table to prevent duplicates and track effectiveness

CREATE TABLE IF NOT EXISTS birthday_email_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL CHECK (email_type IN (
    'birthday_reminder_curated',
    'birthday_connection_no_autogift', 
    'birthday_connection_with_autogift'
  )),
  birthday_year INTEGER NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  email_queue_id UUID REFERENCES email_queue(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate sends per year
  UNIQUE(user_id, email_type, birthday_year)
);

CREATE INDEX idx_birthday_tracking_user ON birthday_email_tracking(user_id);
CREATE INDEX idx_birthday_tracking_year ON birthday_email_tracking(birthday_year);
CREATE INDEX idx_birthday_tracking_sent ON birthday_email_tracking(sent_at);

-- RLS Policies
ALTER TABLE birthday_email_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own birthday email tracking"
  ON birthday_email_tracking
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage birthday tracking"
  ON birthday_email_tracking
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

COMMENT ON TABLE birthday_email_tracking IS 
  'Tracks birthday emails sent to prevent duplicates and measure effectiveness';