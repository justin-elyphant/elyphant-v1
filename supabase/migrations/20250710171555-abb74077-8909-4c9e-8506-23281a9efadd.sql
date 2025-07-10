-- Phase 1: Database Schema Updates for Enhanced Messaging System

-- Add reactions and enhanced message support to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'sent';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES messages(id);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS wishlist_link_id UUID;

-- Create user presence table for real-time status tracking
CREATE TABLE IF NOT EXISTS user_presence (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'away')),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_activity TEXT,
  typing_in_chat_with UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on user_presence
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_presence
CREATE POLICY "Users can view connected users' presence" ON user_presence
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM user_connections 
      WHERE ((user_id = auth.uid() AND connected_user_id = user_presence.user_id) 
          OR (connected_user_id = auth.uid() AND user_id = user_presence.user_id))
        AND status = 'accepted'
    )
  );

CREATE POLICY "Users can update their own presence" ON user_presence
  FOR ALL USING (auth.uid() = user_id);

-- Create typing indicators table
CREATE TABLE IF NOT EXISTS typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  chat_with_user_id UUID NOT NULL REFERENCES auth.users(id),
  is_typing BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, chat_with_user_id)
);

-- Enable RLS on typing_indicators
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- RLS policies for typing_indicators
CREATE POLICY "Users can view typing status in their chats" ON typing_indicators
  FOR SELECT USING (
    auth.uid() = user_id OR auth.uid() = chat_with_user_id
  );

CREATE POLICY "Users can update their own typing status" ON typing_indicators
  FOR ALL USING (auth.uid() = user_id);

-- Enable real-time for all messaging tables
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER TABLE user_presence REPLICA IDENTITY FULL;
ALTER TABLE typing_indicators REPLICA IDENTITY FULL;

-- Create function to update user presence timestamp
CREATE OR REPLACE FUNCTION update_presence_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for presence timestamp updates
CREATE TRIGGER update_user_presence_timestamp
  BEFORE UPDATE ON user_presence
  FOR EACH ROW
  EXECUTE FUNCTION update_presence_timestamp();

-- Create trigger for typing indicators timestamp updates
CREATE TRIGGER update_typing_indicators_timestamp
  BEFORE UPDATE ON typing_indicators
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_reactions ON messages USING GIN(reactions);
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON messages(reply_to_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_status ON user_presence(status);
CREATE INDEX IF NOT EXISTS idx_user_presence_updated_at ON user_presence(updated_at);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_chat ON typing_indicators(user_id, chat_with_user_id);