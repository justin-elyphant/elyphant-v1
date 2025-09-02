-- Add test shipping address to recipient profile for ZMA testing
UPDATE profiles 
SET shipping_address = '{
  "name": "Test Recipient",
  "address_line1": "123 Test Street",
  "address_line2": "Apt 4B", 
  "city": "San Francisco",
  "state": "CA",
  "zip_code": "94102",
  "country": "US",
  "phone": "+1-555-123-4567"
}'::jsonb,
address_verified = true,
address_verification_method = 'manual_test_data',
address_last_updated = now()
WHERE id = '54087479-29f1-4f7f-afd0-cbdc31d6fb91';