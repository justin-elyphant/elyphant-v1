
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase URL or service role key");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Initialize the Supabase client with the service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse the request body
    const { user_id, profile_data } = await req.json();
    
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "User ID is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    console.log("Received profile creation request for user:", user_id);
    console.log("Profile data:", profile_data);
    
    // First verify if user exists in auth
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(user_id);
    
    if (userError || !userData) {
      console.error("Error verifying user or user not found:", userError);
      return new Response(
        JSON.stringify({ 
          error: "User not found in auth system", 
          details: userError 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    console.log("User verified in auth system");
    
    // Check if profile exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('id', user_id)
      .maybeSingle();
      
    if (checkError) {
      console.error("Error checking for profile:", checkError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to check for existing profile", 
          details: checkError 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    let result;
    
    if (existingProfile) {
      console.log("Profile exists, updating...");
      // Update existing profile
      const { data, error } = await supabase
        .from('profiles')
        .update(profile_data)
        .eq('id', user_id)
        .select();
        
      if (error) {
        console.error("Error updating profile:", error);
        throw error;
      }
      
      console.log("Profile updated successfully");
      result = { success: true, action: "updated", data };
    } else {
      console.log("Profile does not exist, creating new profile...");
      
      // Create new profile
      const { data, error } = await supabase
        .from('profiles')
        .insert([{ id: user_id, ...profile_data }])
        .select();
        
      if (error) {
        console.error("Error creating profile:", error);
        
        // If insert fails, try one more time with a minimal profile
        if (error.message.includes("violates not-null constraint")) {
          console.log("Trying again with minimal required fields");
          
          const minimalProfile = {
            id: user_id,
            email: profile_data.email || userData.user.email,
            name: profile_data.name || userData.user.user_metadata?.name || 'User'
          };
          
          const { data: minData, error: minError } = await supabase
            .from('profiles')
            .insert([minimalProfile])
            .select();
            
          if (minError) {
            console.error("Error creating minimal profile:", minError);
            throw minError;
          }
          
          console.log("Minimal profile created successfully");
          result = { success: true, action: "created_minimal", data: minData };
        } else {
          throw error;
        }
      } else {
        console.log("Profile created successfully");
        result = { success: true, action: "created", data };
      }
    }
    
    // Return the success response
    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error in create-profile function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to create/update profile", 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
