-- Phase 4: Storage and Rate Limiting Setup

-- Create storage bucket for message attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('message-attachments', 'message-attachments', false);

-- Create RLS policies for message attachments
CREATE POLICY "Users can upload message attachments" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'message-attachments' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view message attachments in their conversations" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'message-attachments' AND (
      auth.uid()::text = (storage.foldername(name))[1] OR
      EXISTS (
        SELECT 1 FROM messages 
        WHERE messages.id = (storage.foldername(name))[2]::uuid
        AND (messages.sender_id = auth.uid() OR messages.recipient_id = auth.uid())
      )
    )
  );

-- Add attachment support to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_type TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_name TEXT;

-- Create rate limiting table
CREATE TABLE IF NOT EXISTS message_rate_limits (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  messages_sent_today INTEGER DEFAULT 0,
  last_message_date DATE DEFAULT CURRENT_DATE,
  last_message_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_rate_limited BOOLEAN DEFAULT false,
  rate_limit_expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on rate limiting
ALTER TABLE message_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rate limits" ON message_rate_limits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage rate limits" ON message_rate_limits
  FOR ALL USING (true);

-- Create function to check and update rate limits
CREATE OR REPLACE FUNCTION check_message_rate_limit(sender_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  daily_limit INTEGER := 500; -- 500 messages per day
  minute_limit INTEGER := 10; -- 10 messages per minute
  current_count INTEGER;
  last_minute_count INTEGER;
  is_limited BOOLEAN := false;
BEGIN
  -- Insert or update rate limit record
  INSERT INTO message_rate_limits (user_id, messages_sent_today, last_message_date, last_message_time)
  VALUES (sender_uuid, 1, CURRENT_DATE, NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    messages_sent_today = CASE 
      WHEN message_rate_limits.last_message_date < CURRENT_DATE THEN 1
      ELSE message_rate_limits.messages_sent_today + 1
    END,
    last_message_date = CURRENT_DATE,
    last_message_time = NOW();

  -- Check daily limit
  SELECT messages_sent_today INTO current_count
  FROM message_rate_limits
  WHERE user_id = sender_uuid;

  -- Check minute limit
  SELECT COUNT(*) INTO last_minute_count
  FROM messages
  WHERE sender_id = sender_uuid 
  AND created_at > NOW() - INTERVAL '1 minute';

  -- Apply rate limiting
  IF current_count > daily_limit OR last_minute_count >= minute_limit THEN
    UPDATE message_rate_limits 
    SET is_rate_limited = true,
        rate_limit_expires_at = CASE 
          WHEN last_minute_count >= minute_limit THEN NOW() + INTERVAL '1 minute'
          ELSE NOW() + INTERVAL '1 day'
        END
    WHERE user_id = sender_uuid;
    is_limited := true;
  END IF;

  RETURN NOT is_limited;
END;
$$;

-- Create offline message queue table
CREATE TABLE IF NOT EXISTS offline_message_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  recipient_id UUID NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  attachment_url TEXT,
  attachment_type TEXT,
  attachment_name TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  queued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_retry_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT
);

-- Enable RLS on offline queue
ALTER TABLE offline_message_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own message queue" ON offline_message_queue
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_message_rate_limits_user_date ON message_rate_limits(user_id, last_message_date);
CREATE INDEX IF NOT EXISTS idx_offline_queue_status ON offline_message_queue(status, queued_at);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, recipient_id, created_at DESC);