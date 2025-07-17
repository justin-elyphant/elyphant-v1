-- Add birthday and relationship context fields to user_connections table
ALTER TABLE user_connections 
ADD COLUMN pending_recipient_dob TEXT;

ALTER TABLE user_connections 
ADD COLUMN relationship_context JSONB DEFAULT '{
  "closeness_level": 5,
  "interaction_frequency": "regular", 
  "gift_giving_history": [],
  "special_considerations": [],
  "relationship_duration": null,
  "shared_interests": [],
  "gift_preferences": {}
}'::jsonb;

-- Update the comment for pending_shipping_address to include the new fields context
COMMENT ON COLUMN user_connections.pending_recipient_dob IS 'Birthday of pending recipient in YYYY-MM-DD format';
COMMENT ON COLUMN user_connections.relationship_context IS 'Detailed relationship context including closeness level, interaction frequency, shared interests, and gift preferences';