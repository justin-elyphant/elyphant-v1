
import { supabase } from '@/integrations/supabase/client';

let cachedApiKey: string | null = null;
let isLoading = false;
let loadingPromise: Promise<string | null> | null = null;

export const getGoogleMapsApiKey = async (): Promise<string | null> => {
  console.log('🗺️ [GoogleMaps] Starting API key retrieval process...');
  
  // Return cached key if available
  if (cachedApiKey !== null) {
    console.log('🗺️ [GoogleMaps] Using cached API key');
    return cachedApiKey;
  }

  // If already loading, return the existing promise
  if (isLoading && loadingPromise) {
    console.log('🗺️ [GoogleMaps] API key fetch already in progress, waiting...');
    return loadingPromise;
  }

  // Start loading
  isLoading = true;
  loadingPromise = fetchApiKeyFromServer();
  
  try {
    const result = await loadingPromise;
    cachedApiKey = result;
    console.log('🗺️ [GoogleMaps] API key retrieval completed:', result ? '✅ Success' : '❌ Failed');
    return result;
  } finally {
    isLoading = false;
    loadingPromise = null;
  }
};

const fetchApiKeyFromServer = async (): Promise<string | null> => {
  const startTime = Date.now();
  
  try {
    console.log('🗺️ [GoogleMaps] Calling edge function: get-google-maps-key');
    console.log('🗺️ [GoogleMaps] Supabase URL: https://dmkxtkvlispxeqfzlczr.supabase.co');
    
    const { data, error } = await supabase.functions.invoke('get-google-maps-key', {
      method: 'GET'
    });
    
    const elapsed = Date.now() - startTime;
    console.log(`🗺️ [GoogleMaps] Edge function response received (${elapsed}ms)`);
    
    if (error) {
      console.error('🗺️ [GoogleMaps] ❌ Edge function error:', error);
      console.error('🗺️ [GoogleMaps] Error details:', {
        message: error.message,
        status: error.status,
        statusCode: error.statusCode
      });
      return null;
    }

    console.log('🗺️ [GoogleMaps] Raw response data:', data);

    if (!data) {
      console.warn('🗺️ [GoogleMaps] ⚠️ No data returned from edge function');
      return null;
    }

    if (data.error) {
      console.warn('🗺️ [GoogleMaps] ⚠️ Server error:', data.error);
      return null;
    }

    if (!data.apiKey) {
      console.warn('🗺️ [GoogleMaps] ⚠️ No API key in response');
      console.log('🗺️ [GoogleMaps] Response structure:', Object.keys(data));
      return null;
    }

    console.log('🗺️ [GoogleMaps] ✅ Successfully retrieved API key');
    console.log('🗺️ [GoogleMaps] API key length:', data.apiKey.length);
    console.log('🗺️ [GoogleMaps] API key prefix:', data.apiKey.substring(0, 10) + '...');
    
    return data.apiKey;
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`🗺️ [GoogleMaps] ❌ Failed to fetch API key (${elapsed}ms):`, error);
    console.error('🗺️ [GoogleMaps] Error type:', error.constructor.name);
    console.error('🗺️ [GoogleMaps] Error message:', error.message);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('🗺️ [GoogleMaps] Network error - edge function may not be accessible');
    }
    
    return null;
  }
};

// Clear the cache (useful for testing or if key changes)
export const clearApiKeyCache = () => {
  cachedApiKey = null;
  console.log('🗺️ [GoogleMaps] API key cache cleared');
};

// Manual test function for debugging
export const testGoogleMapsApiKey = async (): Promise<void> => {
  console.log('🗺️ [GoogleMaps] 🧪 Starting manual API key test...');
  
  // Clear cache first
  clearApiKeyCache();
  
  // Test the flow
  const apiKey = await getGoogleMapsApiKey();
  
  if (apiKey) {
    console.log('🗺️ [GoogleMaps] 🧪 ✅ Test passed - API key retrieved successfully');
    console.log('🗺️ [GoogleMaps] 🧪 Key format appears valid:', /^AIza[0-9A-Za-z-_]{35}$/.test(apiKey));
  } else {
    console.log('🗺️ [GoogleMaps] 🧪 ❌ Test failed - No API key retrieved');
  }
};

// Expose test function globally for manual testing
if (typeof window !== 'undefined') {
  (window as any).testGoogleMapsApiKey = testGoogleMapsApiKey;
}
