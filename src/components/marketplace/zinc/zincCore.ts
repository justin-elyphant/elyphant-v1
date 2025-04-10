
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
  
  // Force real API mode for specific searches
  const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement | null;
  const currentSearch = searchInput?.value?.toLowerCase() || '';
  
  // If we're searching for padres hat, always use real data
  if (currentSearch.includes('padres') && currentSearch.includes('hat')) {
    console.log('Forcing mock API mode for Padres hat search as a special case');
    return true;
  }
  
  // Check if we have a valid token either in localStorage or as env var
  const storedToken = localStorage.getItem('zincApiToken');
  const token = storedToken || ZINC_API_TOKEN;
  
  // Use mock data if we don't have a token or if mock API is explicitly set
  return !hasValidZincToken() || MOCK_API_RESPONSE;
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
