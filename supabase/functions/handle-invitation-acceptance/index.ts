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
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response("Missing Supabase configuration", { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    // Use service role key to bypass RLS for invitation lookup
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Get invitation details to determine routing
    const { data: invitation, error } = await supabase
      .from("gift_invitation_analytics")
      .select("invitation_type, source_context, user_id, recipient_email, recipient_name, completion_redirect_url, relationship_type, occasion")
      .eq("id", invitationId)
      .single();

    if (error || !invitation) {
      console.error("Invitation not found:", error);
      const appUrl = Deno.env.get("APP_URL") || "https://preview--elyphant.lovable.app";
      return Response.redirect(`${appUrl}/auth?error=invitation_not_found`);
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

    // Route all invitation types to signup/onboarding flow with invitation context
    const appUrl = Deno.env.get("APP_URL") || "https://preview--elyphant.lovable.app";
    const signupParams = new URLSearchParams({
      invitation_id: invitationId,
      recipient_email: invitation.recipient_email,
      recipient_name: invitation.recipient_name,
      invited: "true",
      source: invitation.source_context || invitation.invitation_type || "invite"
    });
    
    // Add additional context for invited users
    if (invitation.user_id) {
      signupParams.set("inviter_context", invitation.user_id);
    }
    
    // Add relationship and occasion context for personalization
    if (invitation.relationship_type) {
      signupParams.set("relationship_type", invitation.relationship_type);
    }
    
    if (invitation.occasion) {
      signupParams.set("occasion", invitation.occasion);
    }
    
    let redirectUrl = `${appUrl}/auth?${signupParams.toString()}`;

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
    const appUrl = Deno.env.get("APP_URL") || "https://preview--elyphant.lovable.app";
    const fallbackUrl = `${appUrl}/auth?error=invitation_processing_failed`;
    
    return Response.redirect(fallbackUrl);
  }
});