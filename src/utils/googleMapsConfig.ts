
let cachedApiKey: string | null = null;

export const getGoogleMapsApiKey = async (): Promise<string | null> => {
  try {
    console.log('🗝️ [GoogleMaps] Fetching API key from server...');
    
    const response = await fetch('https://dmkxtkvlispxeqfzlczr.supabase.co/functions/v1/get-google-maps-key', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRta3h0a3ZsaXNweGVxZnpsY3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3ODYwNTYsImV4cCI6MjA1OTM2MjA1Nn0.L4maWmbU_MgnjWRuc9hGZweXVY4QCYjrnhFMGbdEebI`,
      },
    });

    if (!response.ok) {
      console.warn(`🗝️ [GoogleMaps] ⚠️ API key fetch failed with status: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (data.apiKey) {
      console.log('🗝️ [GoogleMaps] ✅ API key retrieved successfully');
      console.log('🗝️ [GoogleMaps] 🔍 API Key starts with:', data.apiKey.substring(0, 20) + '...');
      cachedApiKey = data.apiKey;
      return data.apiKey;
    } else {
      console.warn('🗝️ [GoogleMaps] ⚠️ No API key in response:', data.error || 'Unknown error');
      return null;
    }
  } catch (error) {
    console.error('🗝️ [GoogleMaps] ❌ Error fetching API key:', error);
    return null;
  }
};

export const testGoogleMapsApiKey = async (): Promise<void> => {
  console.log('🧪 [GoogleMaps] Starting API key test...');
  
  try {
    const apiKey = await getGoogleMapsApiKey();
    
    if (!apiKey) {
      console.error('🧪 [GoogleMaps] ❌ API key test failed: No API key available');
      throw new Error('No API key available');
    }
    
    console.log('🧪 [GoogleMaps] ✅ API key test successful - key retrieved');
    console.log('🧪 [GoogleMaps] 🔍 Testing API key with a simple geocoding request...');
    
    // Test if the API key works by making a simple request
    const testUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=test&key=${apiKey}`;
    const response = await fetch(testUrl);
    const data = await response.json();
    
    console.log('🧪 [GoogleMaps] 📍 Geocoding API response status:', data.status);
    console.log('🧪 [GoogleMaps] 📍 Geocoding API response:', data);
    
    if (data.status === 'OK' || data.status === 'ZERO_RESULTS') {
      console.log('🧪 [GoogleMaps] ✅ API key validation successful');
    } else {
      console.error('🧪 [GoogleMaps] ❌ API key validation failed:', data.status);
      console.error('🧪 [GoogleMaps] ❌ Error details:', data.error_message || 'No error message');
      throw new Error(`API validation failed: ${data.status} - ${data.error_message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('🧪 [GoogleMaps] ❌ API key test failed:', error);
    throw error;
  }
};

export const clearApiKeyCache = (): void => {
  console.log('🗑️ [GoogleMaps] Clearing API key cache...');
  cachedApiKey = null;
  console.log('🗑️ [GoogleMaps] ✅ API key cache cleared');
};
