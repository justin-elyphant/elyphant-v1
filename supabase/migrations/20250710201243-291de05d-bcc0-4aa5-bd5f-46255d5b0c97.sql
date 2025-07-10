-- Add gift proposal and voting support to messages table
ALTER TABLE messages ADD COLUMN message_parent_id UUID REFERENCES messages(id); -- For thread replies
ALTER TABLE messages ADD COLUMN is_gift_proposal BOOLEAN DEFAULT false;
ALTER TABLE messages ADD COLUMN proposal_data JSONB; -- Store gift proposal details
ALTER TABLE messages ADD COLUMN poll_data JSONB; -- Store voting poll data

-- Create gift proposal votes table
CREATE TABLE gift_proposal_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  vote_type TEXT NOT NULL, -- 'approve', 'reject', 'maybe'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Create message mentions table for @mentions
CREATE TABLE message_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(message_id, mentioned_user_id)
);

-- Create indexes for performance
CREATE INDEX idx_messages_parent_id ON messages(message_parent_id) WHERE message_parent_id IS NOT NULL;
CREATE INDEX idx_messages_gift_proposal ON messages(group_chat_id, is_gift_proposal) WHERE is_gift_proposal = true;
CREATE INDEX idx_gift_proposal_votes_message ON gift_proposal_votes(message_id);
CREATE INDEX idx_message_mentions_user ON message_mentions(mentioned_user_id);

-- Enable RLS on new tables
ALTER TABLE gift_proposal_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_mentions ENABLE ROW LEVEL SECURITY;

-- RLS policies for gift proposal votes
CREATE POLICY "Users can view votes in their groups" ON gift_proposal_votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN group_chat_members gcm ON m.group_chat_id = gcm.group_chat_id
      WHERE m.id = gift_proposal_votes.message_id
      AND gcm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create votes in their groups" ON gift_proposal_votes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM messages m
      JOIN group_chat_members gcm ON m.group_chat_id = gcm.group_chat_id
      WHERE m.id = gift_proposal_votes.message_id
      AND gcm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own votes" ON gift_proposal_votes
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for message mentions
CREATE POLICY "Users can view mentions in accessible messages" ON message_mentions
  FOR SELECT USING (
    auth.uid() = mentioned_user_id OR
    EXISTS (
      SELECT 1 FROM messages m
      WHERE m.id = message_mentions.message_id
      AND (
        m.sender_id = auth.uid() OR
        m.recipient_id = auth.uid() OR
        (m.group_chat_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM group_chat_members gcm
          WHERE gcm.group_chat_id = m.group_chat_id
          AND gcm.user_id = auth.uid()
        ))
      )
    )
  );

CREATE POLICY "System can create mentions" ON message_mentions
  FOR INSERT WITH CHECK (true);

-- Add trigger to update updated_at for gift proposal votes
CREATE OR REPLACE FUNCTION update_gift_proposal_votes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_gift_proposal_votes_updated_at
  BEFORE UPDATE ON gift_proposal_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_gift_proposal_votes_updated_at();