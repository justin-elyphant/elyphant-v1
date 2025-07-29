-- Insert ZMA account with provided credentials
INSERT INTO zma_accounts (
  account_name,
  api_key,
  account_balance,
  account_status,
  is_default,
  last_balance_check
) VALUES (
  'Primary ZMA Account',
  '5B394AAF6CD03728E9E33DDF',
  17.50,
  'active',
  true,
  now()
);