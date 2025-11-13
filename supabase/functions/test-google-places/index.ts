import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { query } = await req.json();
    const testQuery = query || 'San Marcos CA';
    
    console.log(`Testing Google Places API with query: ${testQuery}`);
    
    // Get the API key from Supabase secrets
    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    
    if (!apiKey) {
      console.warn('Google Maps API key not found in environment');
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Google Maps API key not configured',
        details: 'API key missing from Supabase secrets'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`API Key found (starts with): ${apiKey.substring(0, 20)}...`);

    // Test 1: Basic Geocoding API
    console.log('Testing Geocoding API...');
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(testQuery)}&key=${apiKey}`;
    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json();
    
    console.log(`Geocoding API Status: ${geocodeData.status}`);
    if (geocodeData.error_message) {
      console.error(`Geocoding API Error: ${geocodeData.error_message}`);
    }

    // Test 2: Places API Autocomplete
    console.log('Testing Places API Autocomplete...');
    const placesUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(testQuery)}&types=address&components=country:us&key=${apiKey}`;
    const placesResponse = await fetch(placesUrl);
    const placesData = await placesResponse.json();
    
    console.log(`Places API Status: ${placesData.status}`);
    if (placesData.error_message) {
      console.error(`Places API Error: ${placesData.error_message}`);
    }

    // Test 3: Places API Text Search
    console.log('Testing Places API Text Search...');
    const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(testQuery)}&key=${apiKey}`;
    const textSearchResponse = await fetch(textSearchUrl);
    const textSearchData = await textSearchResponse.json();
    
    console.log(`Text Search API Status: ${textSearchData.status}`);
    if (textSearchData.error_message) {
      console.error(`Text Search API Error: ${textSearchData.error_message}`);
    }

    // Prepare detailed response
    const diagnostics = {
      success: true,
      apiKeyPresent: !!apiKey,
      apiKeyPrefix: apiKey.substring(0, 20) + '...',
      tests: {
        geocoding: {
          status: geocodeData.status,
          error: geocodeData.error_message || null,
          resultsCount: geocodeData.results?.length || 0,
          firstResult: geocodeData.results?.[0]?.formatted_address || null
        },
        placesAutocomplete: {
          status: placesData.status,
          error: placesData.error_message || null,
          predictionsCount: placesData.predictions?.length || 0,
          firstPrediction: placesData.predictions?.[0]?.description || null
        },
        textSearch: {
          status: textSearchData.status,
          error: textSearchData.error_message || null,
          resultsCount: textSearchData.results?.length || 0,
          firstResult: textSearchData.results?.[0]?.name || null
        }
      },
      recommendations: [] as string[]
    };

    // Generate recommendations based on test results
    if (geocodeData.status === 'REQUEST_DENIED') {
      diagnostics.recommendations.push('API key is invalid or Places API is not enabled');
    }
    if (geocodeData.status === 'OVER_QUERY_LIMIT') {
      diagnostics.recommendations.push('API quota exceeded - check billing and usage limits');
    }
    if (placesData.status === 'REQUEST_DENIED') {
      diagnostics.recommendations.push('Places API specifically is not enabled for this key');
    }
    if (geocodeData.status === 'INVALID_REQUEST') {
      diagnostics.recommendations.push('Check API key restrictions (domains, IPs, referrers)');
    }

    console.log('API Test Results:', JSON.stringify(diagnostics, null, 2));

    return new Response(JSON.stringify(diagnostics), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error testing Google Places API:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Failed to test Google Places API',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});