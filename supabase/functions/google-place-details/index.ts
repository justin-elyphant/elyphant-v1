import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Google Maps API key not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { placeId, fields } = await req.json();

    const params = new URLSearchParams({
      place_id: placeId,
      key: apiKey,
    });

    if (fields?.length) {
      params.set('fields', fields.join(','));
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?${params}`
    );
    const data = await response.json();

    return new Response(JSON.stringify({ place: data.result || null }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Google Place Details error:', error);
    return new Response(JSON.stringify({ error: error.message, place: null }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
