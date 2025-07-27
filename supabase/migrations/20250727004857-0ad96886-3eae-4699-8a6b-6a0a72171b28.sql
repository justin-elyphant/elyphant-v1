-- Clean up duplicate Amazon credentials and ensure only one active record
-- First, identify and keep the most recent active credential
UPDATE elyphant_amazon_credentials 
SET is_active = false, updated_at = now()
WHERE is_active = true 
  AND id NOT IN (
    SELECT id 
    FROM elyphant_amazon_credentials 
    WHERE is_active = true 
    ORDER BY updated_at DESC 
    LIMIT 1
  );

-- Clean up old inactive admin@elyphant.com credentials that might cause confusion
UPDATE elyphant_amazon_credentials 
SET is_active = false, updated_at = now()
WHERE email = 'admin@elyphant.com' 
  AND is_active = false;