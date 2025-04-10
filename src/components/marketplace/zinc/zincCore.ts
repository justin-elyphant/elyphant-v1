
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
  
  // Validate token
  if (!token || token.trim() === '') {
    console.warn('No Zinc API token found. Please set a valid token.');
  }
  
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
  const pathName = window.location.pathname;
  const search = window.location.search.toLowerCase();
  
  // If we're searching for padres hat, always use real data
  const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement | null;
  const currentSearch = searchInput?.value?.toLowerCase() || '';
  if (currentSearch.includes('padres') && currentSearch.includes('hat')) {
    console.log('Forcing real API mode for Padres hat search');
    return false;
  }
  
  // Check if we have a valid token either in localStorage or as env var
  const storedToken = localStorage.getItem('zincApiToken');
  const token = storedToken || ZINC_API_TOKEN;
  
  // Show diagnostic info in console
  if (!token || token.trim() === '') {
    console.warn('No Zinc API token found. Using mock data instead.');
    console.info('To use the real API, set a token using setZincApiToken() or provide it as VITE_ZINC_API_TOKEN.');
  } else {
    console.log('Found Zinc API token (length: ' + token.length + '). Using real API when possible.');
  }
  
  // Use mock data if we don't have a token and mock API is explicitly set
  return (!token || token.trim() === '') && MOCK_API_RESPONSE;
};

/**
 * Check if we have a valid Zinc API token
 */
export const hasValidZincToken = (): boolean => {
  const storedToken = localStorage.getItem('zincApiToken');
  const token = storedToken || ZINC_API_TOKEN;
  return !!(token && token.trim() !== '');
};

/**
 * Set the Zinc API token in localStorage
 */
export const setZincApiToken = (token: string): void => {
  if (token && token.trim() !== '') {
    localStorage.setItem('zincApiToken', token.trim());
    console.log('Zinc API token saved to localStorage');
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
  console.log('Zinc API token removed from localStorage');
};
