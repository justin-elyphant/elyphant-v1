import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const invitationId = url.searchParams.get("invitation_id");
    
    if (!invitationId) {
      return new Response("Missing invitation_id parameter", { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response("Missing Supabase configuration", { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get invitation details to determine routing
    const { data: invitation, error } = await supabase
      .from("gift_invitation_analytics")
      .select("invitation_type, source_context, user_id, recipient_email, recipient_name, completion_redirect_url")
      .eq("id", invitationId)
      .single();

    if (error || !invitation) {
      console.error("Invitation not found:", error);
      return Response.redirect(`${supabaseUrl.replace('//', '//www.')}/signup?error=invitation_not_found`);
    }

    // Track email click event
    await supabase.from("invitation_conversion_events").insert({
      invitation_id: invitationId,
      event_type: "email_clicked",
      event_data: { 
        user_agent: req.headers.get("user-agent") || "unknown",
        clicked_at: new Date().toISOString() 
      }
    });

    console.log("Processing invitation:", invitation);

    // Route based on invitation type and source
    let redirectUrl = "";
    const baseUrl = supabaseUrl.replace('//', '//www.');
    
    switch (invitation.invitation_type) {
      case "nicole_initiated":
      case "auto_gift":
        // Route to Nicole chat for preference collection
        redirectUrl = `${supabaseUrl}/functions/v1/nicole-chatgpt-agent?invitation_id=${invitationId}&mode=invitation_acceptance&recipient_email=${encodeURIComponent(invitation.recipient_email)}&recipient_name=${encodeURIComponent(invitation.recipient_name)}`;
        break;
        
      case "manual_connection":
      default:
        // Route to signup/onboarding flow with invitation context
        const signupParams = new URLSearchParams({
          invitation_id: invitationId,
          recipient_email: invitation.recipient_email,
          recipient_name: invitation.recipient_name,
          inviter_context: "connection_request",
          source: invitation.source_context || "manual_invite"
        });
        redirectUrl = `${baseUrl}/auth?${signupParams.toString()}`;
        break;
    }

    // Use custom redirect URL if specified
    if (invitation.completion_redirect_url) {
      const customUrl = new URL(invitation.completion_redirect_url);
      customUrl.searchParams.set("invitation_id", invitationId);
      redirectUrl = customUrl.toString();
    }

    console.log("Redirecting to:", redirectUrl);

    return Response.redirect(redirectUrl);

  } catch (error: any) {
    console.error("Error in handle-invitation-acceptance:", error);
    
    // Fallback redirect to signup with error context
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const fallbackUrl = `${supabaseUrl?.replace('//', '//www.')}/auth?error=invitation_processing_failed`;
    
    return Response.redirect(fallbackUrl);
  }
});