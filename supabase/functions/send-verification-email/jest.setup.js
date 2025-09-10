// Setup file to define global variables and mock environment
process.env = {
  ...process.env,
  ENVIRONMENT: 'test',
  RESEND_API_KEY: 'test_resend_key',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test_supabase_key'
};

// Mock console methods to keep test output clean
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};
