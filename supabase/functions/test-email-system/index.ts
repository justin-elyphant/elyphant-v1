import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { emailType } = await req.json();
    
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Call the main email orchestrator
    const response = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/ecommerce-email-orchestrator`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`
        },
        body: JSON.stringify({
          eventType: emailType || 'user_welcomed',
          userId: '0478a7d7-9d59-40bf-954e-657fa28fe251' // Test user ID
        })
      }
    );

    const result = await response.json();
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: `Email system test completed for ${emailType}`,
      result
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in test-email-system:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Failed to test email system" 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});