-- Insert accepted connection: Justin invited Heather
INSERT INTO public.user_connections (user_id, connected_user_id, status, relationship_type, created_at, updated_at)
VALUES (
  'a3a6e0fb-4b2c-4627-a675-a08480d60f89',  -- Justin (inviter)
  '49095bac-2caf-4e7a-915a-a0b735dff12b',  -- Heather (invitee)
  'accepted',
  'spouse',
  now(),
  now()
);

-- Insert beta referral record for admin approval
INSERT INTO public.beta_referrals (referrer_id, referred_id, referred_email, status, reward_amount, created_at)
VALUES (
  'a3a6e0fb-4b2c-4627-a675-a08480d60f89',  -- Justin (referrer)
  '49095bac-2caf-4e7a-915a-a0b735dff12b',  -- Heather (referred)
  'heatherlaurenh@yahoo.com',
  'pending',
  100,
  now()
);