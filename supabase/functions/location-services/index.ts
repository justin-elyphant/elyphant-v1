import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
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
    const { operation, data } = await req.json();
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get Google Maps API key
    const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!googleMapsApiKey) {
      throw new Error('Google Maps API key not configured');
    }

    console.log(`🌍 [LocationServices] Processing operation: ${operation}`);

    switch (operation) {
      case 'geocode':
        return await handleGeocode(data, googleMapsApiKey, supabase);
      
      case 'reverse_geocode':
        return await handleReverseGeocode(data, googleMapsApiKey, supabase);
      
      case 'distance_matrix':
        return await handleDistanceMatrix(data, googleMapsApiKey, supabase);
      
      case 'place_details':
        return await handlePlaceDetails(data, googleMapsApiKey, supabase);
      
      default:
        return new Response(JSON.stringify({ 
          error: 'Unknown operation',
          supportedOperations: ['geocode', 'reverse_geocode', 'distance_matrix', 'place_details']
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('🌍 [LocationServices] Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleGeocode(data: any, apiKey: string, supabase: any) {
  const { address } = data;
  
  // Check cache first
  const cacheKey = `geocode_${address}`;
  const { data: cached } = await supabase
    .from('location_cache')
    .select('cache_data')
    .eq('cache_key', cacheKey)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  
  if (cached) {
    console.log('🌍 [LocationServices] Cache hit for geocoding');
    return new Response(JSON.stringify({ 
      success: true, 
      data: cached.cache_data,
      cached: true 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Make Google Maps API call
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
  const response = await fetch(url);
  const result = await response.json();

  if (result.status === 'OK' && result.results.length > 0) {
    const location = result.results[0];
    const coordinates = {
      lat: location.geometry.location.lat,
      lng: location.geometry.location.lng
    };

    // Cache the result
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Cache for 24 hours
    
    await supabase
      .from('location_cache')
      .upsert({
        cache_key: cacheKey,
        cache_data: coordinates,
        cache_type: 'geocoding',
        expires_at: expiresAt.toISOString()
      });

    return new Response(JSON.stringify({ 
      success: true, 
      data: coordinates,
      cached: false 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ 
    success: false, 
    error: 'Geocoding failed',
    status: result.status 
  }), {
    status: 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleReverseGeocode(data: any, apiKey: string, supabase: any) {
  const { lat, lng } = data;
  
  const cacheKey = `reverse_geocode_${lat},${lng}`;
  const { data: cached } = await supabase
    .from('location_cache')
    .select('cache_data')
    .eq('cache_key', cacheKey)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  
  if (cached) {
    return new Response(JSON.stringify({ 
      success: true, 
      data: cached.cache_data,
      cached: true 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
  const response = await fetch(url);
  const result = await response.json();

  if (result.status === 'OK' && result.results.length > 0) {
    const address = result.results[0];
    const components = address.address_components;
    
    const standardized = {
      street: getAddressComponent(components, 'street_number') + ' ' + getAddressComponent(components, 'route'),
      city: getAddressComponent(components, 'locality'),
      state: getAddressComponent(components, 'administrative_area_level_1'),
      zipCode: getAddressComponent(components, 'postal_code'),
      country: getAddressComponent(components, 'country'),
      formatted_address: address.formatted_address
    };

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    await supabase
      .from('location_cache')
      .upsert({
        cache_key: cacheKey,
        cache_data: standardized,
        cache_type: 'reverse_geocoding',
        expires_at: expiresAt.toISOString()
      });

    return new Response(JSON.stringify({ 
      success: true, 
      data: standardized,
      cached: false 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ 
    success: false, 
    error: 'Reverse geocoding failed',
    status: result.status 
  }), {
    status: 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleDistanceMatrix(data: any, apiKey: string, supabase: any) {
  const { origins, destinations } = data;
  
  const cacheKey = `distance_matrix_${JSON.stringify({ origins, destinations })}`;
  const { data: cached } = await supabase
    .from('location_cache')
    .select('cache_data')
    .eq('cache_key', cacheKey)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  
  if (cached) {
    return new Response(JSON.stringify({ 
      success: true, 
      data: cached.cache_data,
      cached: true 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const originsStr = origins.join('|');
  const destinationsStr = destinations.join('|');
  
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(originsStr)}&destinations=${encodeURIComponent(destinationsStr)}&units=imperial&key=${apiKey}`;
  const response = await fetch(url);
  const result = await response.json();

  if (result.status === 'OK') {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 6); // Cache for 6 hours (more volatile)
    
    await supabase
      .from('location_cache')
      .upsert({
        cache_key: cacheKey,
        cache_data: result,
        cache_type: 'distance_matrix',
        expires_at: expiresAt.toISOString()
      });

    return new Response(JSON.stringify({ 
      success: true, 
      data: result,
      cached: false 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ 
    success: false, 
    error: 'Distance matrix calculation failed',
    status: result.status 
  }), {
    status: 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handlePlaceDetails(data: any, apiKey: string, supabase: any) {
  const { placeId } = data;
  
  const cacheKey = `place_details_${placeId}`;
  const { data: cached } = await supabase
    .from('location_cache')
    .select('cache_data')
    .eq('cache_key', cacheKey)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  
  if (cached) {
    return new Response(JSON.stringify({ 
      success: true, 
      data: cached.cache_data,
      cached: true 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,geometry,address_components,business_status,opening_hours,formatted_phone_number&key=${apiKey}`;
  const response = await fetch(url);
  const result = await response.json();

  if (result.status === 'OK') {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Cache for 7 days
    
    await supabase
      .from('location_cache')
      .upsert({
        cache_key: cacheKey,
        cache_data: result.result,
        cache_type: 'place_details',
        expires_at: expiresAt.toISOString()
      });

    return new Response(JSON.stringify({ 
      success: true, 
      data: result.result,
      cached: false 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ 
    success: false, 
    error: 'Place details fetch failed',
    status: result.status 
  }), {
    status: 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function getAddressComponent(components: any[], type: string): string {
  const component = components.find(c => c.types.includes(type));
  return component ? component.long_name : '';
}