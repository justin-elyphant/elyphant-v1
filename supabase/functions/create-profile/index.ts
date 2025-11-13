
// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

// Default data sharing settings that match our utility
const getDefaultDataSharingSettings = () => {
  return {
    dob: "friends",
    shipping_address: "private",
    gift_preferences: "public",
    email: "private" // Always private by default for email
  };
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') 
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables for Supabase connection')
    }
    
    // Initialize Supabase client with the service role key (admin powers)
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const body = await req.json()
    const { user_id, profile_data } = body
    
    if (!user_id) {
      throw new Error('user_id is required')
    }
    
    console.log(`Creating/updating profile for user: ${user_id}`)
    
    // Ensure we have all required fields with proper defaults
    const dataSharingSettings = {
      ...getDefaultDataSharingSettings(),
      ...(profile_data.data_sharing_settings || {})
    };
    
    // Always ensure email sharing setting is explicitly set to private
    dataSharingSettings.email = "private";
    
    const safeProfileData = {
      id: user_id,
      ...profile_data,
      shipping_address: profile_data.shipping_address || {
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: ""
      },
      gift_preferences: Array.isArray(profile_data.gift_preferences) ? profile_data.gift_preferences : [],
      data_sharing_settings: dataSharingSettings,
      important_dates: Array.isArray(profile_data.important_dates) ? profile_data.important_dates : [],
      updated_at: new Date().toISOString()
    }
    
    console.log(`Profile data to insert: ${JSON.stringify(safeProfileData, null, 2)}`)
    
    // Create or update the profile
    const { data, error } = await supabase
      .from('profiles')
      .upsert(safeProfileData, { onConflict: 'id' })
      .select()
    
    if (error) {
      console.error(`Error creating profile: ${error.message}`)
      throw error
    }
    
    console.log(`Profile created/updated successfully: ${JSON.stringify(data, null, 2)}`)
    
    return new Response(
      JSON.stringify({ success: true, data }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error(`Error in create-profile function: ${error.message}`)
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
