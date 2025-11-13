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
    console.log('📍 [GooglePlaceDetails] Starting request processing');
    
    const { placeId, fields = ['place_id', 'formatted_address', 'address_components', 'geometry'] } = await req.json();
    
    if (!placeId) {
      return new Response(
        JSON.stringify({ 
          error: 'Place ID is required',
          place: null
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    console.log(`📍 [GooglePlaceDetails] Processing place ID: "${placeId}"`);

    // Get Google Maps API key from Supabase secrets
    const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    
    if (!googleMapsApiKey) {
      console.error('📍 [GooglePlaceDetails] No Google Maps API key found');
      return new Response(
        JSON.stringify({ 
          error: 'Google Maps API key not configured',
          place: null
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    console.log('📍 [GooglePlaceDetails] API key found, making request to Google Place Details API');

    // Build the Google Place Details API URL
    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    url.searchParams.set('place_id', placeId);
    url.searchParams.set('key', googleMapsApiKey);
    url.searchParams.set('fields', fields.join(','));

    console.log(`📍 [GooglePlaceDetails] Request URL: ${url.toString().replace(googleMapsApiKey, 'HIDDEN_KEY')}`);

    // Make the request to Google Place Details API
    const response = await fetch(url.toString());
    const data = await response.json();

    console.log(`📍 [GooglePlaceDetails] Google API response status: ${data.status}`);

    if (data.status === 'OK' && data.result) {
      console.log('📍 [GooglePlaceDetails] ✅ Successfully got place details');
      
      return new Response(
        JSON.stringify({ place: data.result }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } else {
      console.error(`📍 [GooglePlaceDetails] Google API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
      
      return new Response(
        JSON.stringify({ 
          error: `Google Place Details API error: ${data.status}`,
          place: null,
          details: data.error_message
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }
  } catch (error) {
    console.error('📍 [GooglePlaceDetails] Function error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        place: null
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
})