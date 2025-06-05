
import { supabase } from '@/integrations/supabase/client';

let cachedApiKey: string | null = null;
let isLoading = false;
let loadingPromise: Promise<string | null> | null = null;

export const getGoogleMapsApiKey = async (): Promise<string | null> => {
  // Return cached key if available
  if (cachedApiKey !== null) {
    console.log('Using cached Google Maps API key');
    return cachedApiKey;
  }

  // If already loading, return the existing promise
  if (isLoading && loadingPromise) {
    console.log('Google Maps API key fetch already in progress, waiting...');
    return loadingPromise;
  }

  // Start loading
  isLoading = true;
  loadingPromise = fetchApiKeyFromServer();
  
  try {
    const result = await loadingPromise;
    cachedApiKey = result;
    return result;
  } finally {
    isLoading = false;
    loadingPromise = null;
  }
};

const fetchApiKeyFromServer = async (): Promise<string | null> => {
  try {
    console.log('Fetching Google Maps API key from edge function...');
    
    const { data, error } = await supabase.functions.invoke('get-google-maps-key');
    
    if (error) {
      console.error('Error calling get-google-maps-key function:', error);
      return null;
    }

    if (!data) {
      console.warn('No data returned from get-google-maps-key function');
      return null;
    }

    if (data.error) {
      console.warn('Server error retrieving Google Maps API key:', data.error);
      return null;
    }

    if (!data.apiKey) {
      console.warn('Google Maps API key not found in server response');
      return null;
    }

    console.log('Successfully retrieved Google Maps API key from server');
    return data.apiKey;
  } catch (error) {
    console.error('Failed to fetch Google Maps API key from server:', error);
    return null;
  }
};

// Clear the cache (useful for testing or if key changes)
export const clearApiKeyCache = () => {
  cachedApiKey = null;
  console.log('Google Maps API key cache cleared');
};
