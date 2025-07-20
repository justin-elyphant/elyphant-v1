
-- Update the default gifting fee display name to "Elyphant Gifting Fee"
UPDATE pricing_settings 
SET fee_display_name = 'Elyphant Gifting Fee'
WHERE setting_name = 'default_gifting_fee' AND is_active = true;
