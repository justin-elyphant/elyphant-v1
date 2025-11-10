-- Add gift_occasion and relationship_type columns to pending_gift_invitations table
ALTER TABLE pending_gift_invitations 
ADD COLUMN IF NOT EXISTS gift_occasion TEXT,
ADD COLUMN IF NOT EXISTS relationship_type TEXT;

-- Add index for better query performance when filtering by occasion
CREATE INDEX IF NOT EXISTS idx_pending_gift_invitations_occasion 
ON pending_gift_invitations(gift_occasion);

-- Add index for relationship type queries
CREATE INDEX IF NOT EXISTS idx_pending_gift_invitations_relationship 
ON pending_gift_invitations(relationship_type);