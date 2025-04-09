
// Base URL for Zinc API
export const ZINC_API_BASE_URL = 'https://api.zinc.io/v1';

// Environment variables
const ZINC_API_TOKEN = import.meta.env.VITE_ZINC_API_TOKEN || 'DEMO_TOKEN';
const MOCK_API_RESPONSE = import.meta.env.VITE_MOCK_API === 'true' || true;

/**
 * Get headers needed for Zinc API requests
 */
export const getZincHeaders = () => {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ZINC_API_TOKEN}`
  };
};

/**
 * Check if we're in test mode (use mock data)
 */
export const isTestMode = (): boolean => {
  // Always use mock data if the env variable is set
  if (MOCK_API_RESPONSE) return true;
  
  // Allow URL query parameter to override (for testing)
  const urlParams = new URLSearchParams(window.location.search);
  const mockParam = urlParams.get('mock');
  
  if (mockParam === 'true') return true;
  if (mockParam === 'false') return false;
  
  // Check if ZINC_API_TOKEN is real or a placeholder
  const isRealToken = ZINC_API_TOKEN !== 'DEMO_TOKEN' && 
                      ZINC_API_TOKEN.length > 10;
  
  return !isRealToken;
};
