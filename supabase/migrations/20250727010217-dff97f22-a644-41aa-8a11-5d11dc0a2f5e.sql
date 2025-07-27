-- Add missing totp_2fa_key column to elyphant_amazon_credentials table
-- This fixes the database schema mismatch causing order retry failures

ALTER TABLE elyphant_amazon_credentials 
ADD COLUMN IF NOT EXISTS totp_2fa_key TEXT;