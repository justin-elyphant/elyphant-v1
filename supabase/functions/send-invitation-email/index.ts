import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationPayload {
  recipientName: string;
  recipientEmail: string;
  relationship: string;
  occasion: string;
  personalMessage?: string;
  giftorName?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response(JSON.stringify({ error: "Missing Supabase env" }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
  if (!resendApiKey) {
    return new Response(JSON.stringify({ error: "Missing RESEND_API_KEY" }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
  });

  try {
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const payload: InvitationPayload = await req.json();
    const giftorFirstName = payload.giftorName || user.user_metadata?.first_name || user.user_metadata?.name?.split(" ")[0] || "A friend";

    // Insert analytics row first
    const { data: analyticsRow, error: analyticsError } = await supabase
      .from("gift_invitation_analytics")
      .insert({
        user_id: user.id,
        recipient_email: payload.recipientEmail,
        recipient_name: payload.recipientName,
        relationship_type: payload.relationship,
        occasion: payload.occasion,
        metadata: { personalMessage: payload.personalMessage || null }
      })
      .select()
      .single();

    if (analyticsError) {
      console.error("insert analytics error", analyticsError);
      return new Response(JSON.stringify({ error: analyticsError.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const resend = new Resend(resendApiKey);

    const subject = `${giftorFirstName} invited you to join Elyphant for ${payload.occasion} 🎁`;
    const html = `
      <div style="font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height:1.6; color:#0f172a;">
        <h2>Hey ${payload.recipientName} 👋</h2>
        <p><strong>${giftorFirstName}</strong> wants to get you the perfect ${payload.occasion} gift on Elyphant.</p>
        ${payload.personalMessage ? `<blockquote style="margin: 16px 0; padding: 12px 16px; background:#f1f5f9; border-left:4px solid #6366f1; border-radius:8px;">${payload.personalMessage}</blockquote>` : ''}
        <p>Join with one click to share your preferences and make gifting easy.</p>
        <p><a href="https://dmkxtkvlispxeqfzlczr.supabase.co/functions/v1/nicole-chatgpt-agent?invitation_id=${analyticsRow.id}"
              style="display:inline-block; background:#6366f1; color:white; padding:12px 18px; border-radius:999px; text-decoration:none;">Accept Invitation</a></p>
        <p style="font-size:12px; color:#64748b;">If you didn't expect this, you can ignore this email.</p>
      </div>
    `;

    const email = await resend.emails.send({
      from: "Elyphant <no-reply@resend.dev>",
      to: [payload.recipientEmail],
      subject,
      html,
    });

    console.log("Invitation email sent", email);

    // Create conversion event record for email_sent
    await supabase.from("invitation_conversion_events").insert({
      invitation_id: analyticsRow.id,
      event_type: "email_sent",
      event_data: { method: "resend" }
    });

    return new Response(JSON.stringify({ success: true, invitation_id: analyticsRow.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("send-invitation-email error", error);
    return new Response(JSON.stringify({ error: error?.message || "Unknown error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
