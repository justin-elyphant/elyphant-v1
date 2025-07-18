
-- Add verification_code field to elyphant_amazon_credentials table
ALTER TABLE elyphant_amazon_credentials 
ADD COLUMN verification_code text;

-- Add a comment to document the field's purpose
COMMENT ON COLUMN elyphant_amazon_credentials.verification_code IS 'Amazon email verification code required when account is locked for verification';
