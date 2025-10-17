
-- Insert connection records for Curt Davidson and Heather Hunter with full shipping addresses
INSERT INTO public.user_connections (
  user_id,
  connected_user_id,
  status,
  pending_recipient_name,
  pending_recipient_email,
  pending_shipping_address,
  invitation_token,
  relationship_type
) VALUES 
-- Curt Davidson (existing user)
(
  'a3a6e0fb-4b2c-4627-a675-a08480d60f89',
  'e306dd36-1860-4520-a74c-fef4473aa763',
  'pending_invitation',
  'Curt Davidson',
  'curtb45@gmail.com',
  jsonb_build_object(
    'street', '970 West Valley Parkway',
    'city', 'Escondido',
    'state', 'CA',
    'zipCode', '92025',
    'country', 'US'
  ),
  gen_random_uuid()::text,
  'friend'
),
-- Heather Hunter
(
  'a3a6e0fb-4b2c-4627-a675-a08480d60f89',
  NULL,
  'pending_invitation',
  'Heather Hunter',
  'heather@example.com',
  jsonb_build_object(
    'street', '456 Ocean Boulevard',
    'city', 'Carlsbad', 
    'state', 'CA',
    'zipCode', '92008',
    'country', 'US'
  ),
  gen_random_uuid()::text,
  'friend'
)
ON CONFLICT DO NOTHING;
