
// Base URL for Zinc API
export const ZINC_API_BASE_URL = 'https://api.zinc.io/v1';

// Environment variables
const MOCK_API_RESPONSE = import.meta.env.VITE_MOCK_API === 'true' || false; // Default to false to use real API

/**
 * Get headers needed for Zinc API requests using Basic Auth
 * Note: This is only used for client-side API calls, which are deprecated.
 * The edge function handles API authentication server-side.
 */
export const getZincHeaders = () => {
  // This function is deprecated - API calls should go through edge functions
  console.warn('getZincHeaders is deprecated. Use edge functions for API calls.');
  
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
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
  
  // Default to using real API unless explicitly in mock mode
  return MOCK_API_RESPONSE;
};

/**
 * Legacy functions - these are maintained for backward compatibility
 * but should not be used for API validation since API calls go through edge functions
 */

/**
 * Set a placeholder token in localStorage (legacy support)
 */
export const setZincApiToken = (token: string): void => {
  if (token && token.trim() !== '') {
    localStorage.setItem('zincApiToken', token.trim());
    console.log('Zinc API token saved to localStorage (legacy)');
    
    const connection = {
      autoFulfillment: false,
      lastSync: Date.now()
    };
    localStorage.setItem("zincConnection", JSON.stringify(connection));
  } else {
    console.warn('Attempted to save empty Zinc API token. No changes made.');
  }
};

/**
 * Get the current token from localStorage (legacy support)
 */
export const getZincApiToken = (): string => {
  return localStorage.getItem('zincApiToken') || '';
};

/**
 * Clear the token from localStorage (legacy support)
 */
export const clearZincApiToken = (): void => {
  localStorage.removeItem('zincApiToken');
  localStorage.removeItem("zincConnection");
  console.log('Zinc API token removed from localStorage (legacy)');
};
