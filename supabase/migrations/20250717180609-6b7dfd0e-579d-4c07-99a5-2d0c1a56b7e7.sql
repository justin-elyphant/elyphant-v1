-- Add phone number field to user_connections table
ALTER TABLE user_connections 
ADD COLUMN pending_recipient_phone TEXT;

-- Update existing pending_shipping_address structure documentation
-- The pending_shipping_address JSONB will now include:
-- {
--   "firstName": "string",
--   "lastName": "string", 
--   "address": "string",
--   "address_line_2": "string",
--   "city": "string",
--   "state": "string",
--   "zipCode": "string",
--   "country": "string",
--   "phone": "string"
-- }

-- No schema change needed for pending_shipping_address as JSONB is flexible
-- But we'll add a comment for documentation
COMMENT ON COLUMN user_connections.pending_shipping_address IS 'Standardized shipping address JSONB structure including firstName, lastName, address, address_line_2, city, state, zipCode, country, and phone';