
// Base URL for Zinc API
export const ZINC_API_BASE_URL = 'https://api.zinc.io/v1';

// Environment variables
const ZINC_API_TOKEN = import.meta.env.VITE_ZINC_API_TOKEN || '';
const MOCK_API_RESPONSE = import.meta.env.VITE_MOCK_API === 'true' || false;

/**
 * Get headers needed for Zinc API requests
 */
export const getZincHeaders = () => {
  // Get the token from localStorage if available, otherwise use env var
  const storedToken = localStorage.getItem('zincApiToken');
  const token = storedToken || ZINC_API_TOKEN;
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token || ''}`
  };
};

/**
 * Check if we're in test mode (use mock data)
 */
export const isTestMode = (): boolean => {
  // Check for the URL param first (for testing)
  const urlParams = new URLSearchParams(window.location.search);
  const mockParam = urlParams.get('mock');
  
  if (mockParam === 'true') return true;
  if (mockParam === 'false') return false;
  
  // We have a valid token, don't use mock data
  if (hasValidZincToken()) {
    return false;
  }
  
  // Only use mock data if explicitly set or we don't have a token
  return MOCK_API_RESPONSE;
};

/**
 * Check if we have a valid Zinc API token
 */
export const hasValidZincToken = (): boolean => {
  const storedToken = localStorage.getItem('zincApiToken');
  const token = storedToken || ZINC_API_TOKEN;
  
  // Consider a token valid if it's at least 10 chars
  // This allows for testing with dummy tokens during development
  return !!(token && token.trim() !== '' && token.trim().length >= 10);
};

/**
 * Set the Zinc API token in localStorage
 */
export const setZincApiToken = (token: string): void => {
  if (token && token.trim() !== '') {
    // Store the token
    localStorage.setItem('zincApiToken', token.trim());
    console.log('Zinc API token saved to localStorage');
    
    // Also store connection status
    const connection = {
      autoFulfillment: false,
      lastSync: Date.now()
    };
    localStorage.setItem("zincConnection", JSON.stringify(connection));
    
    // Log that we have a valid token
    console.log('Zinc API token set. Token valid:', hasValidZincToken());
  } else {
    console.warn('Attempted to save empty Zinc API token. No changes made.');
  }
};

/**
 * Get the current Zinc API token
 */
export const getZincApiToken = (): string => {
  const storedToken = localStorage.getItem('zincApiToken') || '';
  const envToken = ZINC_API_TOKEN || '';
  return storedToken || envToken;
};

/**
 * Clear the Zinc API token from localStorage
 */
export const clearZincApiToken = (): void => {
  localStorage.removeItem('zincApiToken');
  localStorage.removeItem("zincConnection");
  console.log('Zinc API token removed from localStorage');
};
