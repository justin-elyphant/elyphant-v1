import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 [GooglePlacesAutocomplete] Starting request processing');
    
    const { input, types = ['geocode'], componentRestrictions = { country: 'us' } } = await req.json();
    
    if (!input || input.length < 3) {
      return new Response(
        JSON.stringify({ 
          error: 'Input must be at least 3 characters',
          predictions: []
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    console.log(`🔍 [GooglePlacesAutocomplete] Processing input: "${input}"`);

    // Get Google Maps API key from Supabase secrets
    const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    
    if (!googleMapsApiKey) {
      console.error('🔍 [GooglePlacesAutocomplete] No Google Maps API key found');
      return new Response(
        JSON.stringify({ 
          error: 'Google Maps API key not configured',
          predictions: []
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    console.log('🔍 [GooglePlacesAutocomplete] API key found, making request to Google Places API');

    // Build the Google Places Autocomplete API URL
    const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
    url.searchParams.set('input', input);
    url.searchParams.set('key', googleMapsApiKey);
    url.searchParams.set('types', types.join('|'));
    
    if (componentRestrictions.country) {
      url.searchParams.set('components', `country:${componentRestrictions.country}`);
    }

    console.log(`🔍 [GooglePlacesAutocomplete] Request URL: ${url.toString().replace(googleMapsApiKey, 'HIDDEN_KEY')}`);

    // Make the request to Google Places API
    const response = await fetch(url.toString());
    const data = await response.json();

    console.log(`🔍 [GooglePlacesAutocomplete] Google API response status: ${data.status}`);
    console.log(`🔍 [GooglePlacesAutocomplete] Predictions count: ${data.predictions?.length || 0}`);

    if (data.status === 'OK' && data.predictions) {
      // Format the predictions to match our interface
      const formattedPredictions = data.predictions.map((prediction: any) => ({
        place_id: prediction.place_id,
        description: prediction.description,
        structured_formatting: {
          main_text: prediction.structured_formatting.main_text,
          secondary_text: prediction.structured_formatting.secondary_text
        }
      }));

      return new Response(
        JSON.stringify({ predictions: formattedPredictions }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } else {
      console.error(`🔍 [GooglePlacesAutocomplete] Google API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
      
      return new Response(
        JSON.stringify({ 
          error: `Google Places API error: ${data.status}`,
          predictions: [],
          details: data.error_message
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }
  } catch (error) {
    console.error('🔍 [GooglePlacesAutocomplete] Function error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        predictions: []
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
})