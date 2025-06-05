
export const getGoogleMapsApiKey = async (): Promise<string | null> => {
  try {
    console.log('🗝️ [GoogleMaps] Fetching API key from server...');
    
    const response = await fetch('/api/get-google-maps-key', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`🗝️ [GoogleMaps] ⚠️ API key fetch failed with status: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (data.apiKey) {
      console.log('🗝️ [GoogleMaps] ✅ API key retrieved successfully');
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
