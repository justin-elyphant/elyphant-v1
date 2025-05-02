
// Base URL for Zinc API
export const ZINC_API_BASE_URL = 'https://api.zinc.io/v1';

// Environment variables
const ZINC_API_TOKEN = import.meta.env.VITE_ZINC_API_TOKEN || '';
const MOCK_API_RESPONSE = import.meta.env.VITE_MOCK_API === 'true' || false; // Default to false to use real API

/**
 * Get headers needed for Zinc API requests using Basic Auth
 */
export const getZincHeaders = () => {
  // We'll assume API key is always properly configured in the database
  // and accessed through the Supabase function
  
  return {
    'Content-Type': 'application/json',
    // CORS headers - though these only work server-side
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
 * Check if we have a valid Zinc API token
 * We'll assume we do since it's stored in the database
 */
export const hasValidZincToken = (): boolean => {
  return true; // We assume the token in the database is valid
};

/**
 * Set the Zinc API token in localStorage
 */
export const setZincApiToken = (token: string): void => {
  // This function is no longer needed as we store the token in the database
  console.log('Zinc API token is now managed through the database');
};

/**
 * Get the current Zinc API token
 */
export const getZincApiToken = (): string => {
  // We'll return a placeholder since the actual token is used server-side
  return "API_KEY_STORED_IN_DATABASE";
};

/**
 * Clear the Zinc API token from localStorage
 */
export const clearZincApiToken = (): void => {
  // This function is no longer needed
  console.log('Zinc API token is now managed through the database');
};
