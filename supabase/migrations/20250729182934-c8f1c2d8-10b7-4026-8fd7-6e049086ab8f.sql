-- Insert ZMA account with provided credentials
INSERT INTO zma_accounts (
  account_name,
  api_key,
  account_balance,
  is_default,
  is_active,
  last_balance_check,
  created_at,
  updated_at
) VALUES (
  'Primary ZMA Account',
  '5B394AAF6CD03728E9E33DDF',
  17.50,
  true,
  true,
  now(),
  now(),
  now()
);