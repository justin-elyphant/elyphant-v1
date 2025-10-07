import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GiftInvitationRequest {
  recipientEmail: string;
  recipientName: string;
  giftorName: string;
  occasion?: string;
  eventDate?: string;
  relationship?: string;
}

/**
 * Simplified gift invitation sender
 * Routes through ecommerce-email-orchestrator for consistency
 */
const handler = async (req: Request): Promise<Response> => {
  console.log("🎁 Gift invitation function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { 
      recipientEmail, 
      recipientName, 
      giftorName, 
      occasion, 
      eventDate,
      relationship = 'friend'
    }: GiftInvitationRequest = await req.json();

    console.log("📧 Sending gift invitation:", { 
      recipientEmail, 
      recipientName, 
      giftorName, 
      occasion 
    });

    // Create personalized invitation message
    const occasionText = occasion ? ` for your upcoming ${occasion}` : '';
    const dateText = eventDate ? ` on ${new Date(eventDate).toLocaleDateString()}` : '';
    
    const invitationUrl = `${Deno.env.get("SUPABASE_URL") || 'https://dmkxtkvlispxeqfzlczr.supabase.co'}/profile-setup?invited=true&giftor=${encodeURIComponent(giftorName)}&occasion=${occasion || ''}&relationship=${relationship}`;

    // Route through ecommerce-email-orchestrator for consistency
    const orchestratorResponse = await supabaseClient.functions.invoke('ecommerce-email-orchestrator', {
      body: {
        eventType: 'gift_invitation',
        customData: {
          recipientEmail,
          recipientName,
          giftorName,
          occasion,
          occasionText,
          eventDate,
          dateText,
          relationship,
          invitationUrl
        }
      }
    });

    if (orchestratorResponse.error) {
      throw new Error(`Orchestrator error: ${orchestratorResponse.error.message}`)
    }

    console.log("✅ Gift invitation email sent successfully via orchestrator");

    return new Response(JSON.stringify({ 
      success: true, 
      invitationUrl 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("❌ Error in send-gift-invitation function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);