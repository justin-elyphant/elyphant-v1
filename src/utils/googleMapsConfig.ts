
export const getGoogleMapsApiKey = (): string | null => {
  // In a Supabase environment, the secret would be available through edge functions
  // For now, we'll check if it's available in the environment
  try {
    // This would typically be handled by a Supabase edge function
    return import.meta.env.VITE_GOOGLE_MAPS_API_KEY || null;
  } catch (error) {
    console.warn('Google Maps API key not available:', error);
    return null;
  }
};
