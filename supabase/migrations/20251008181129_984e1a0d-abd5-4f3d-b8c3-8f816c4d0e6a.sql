-- Add Zinc per-order fulfillment fee column to pricing_settings
ALTER TABLE pricing_settings 
ADD COLUMN zinc_per_order_fee numeric DEFAULT 1.00 NOT NULL;

-- Update the default gifting fee description to include fulfillment services
UPDATE pricing_settings 
SET fee_description = 'Our Gifting Fee covers platform technology, fulfillment services, customer support, gift tracking, and curated shopping experience'
WHERE setting_name = 'default_gifting_fee';