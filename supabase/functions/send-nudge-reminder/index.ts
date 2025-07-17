import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NudgeReminderRequest {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  senderUserId: string;
  nudgeMethod: 'email' | 'sms' | 'both';
  customMessage: string;
  connectionId?: string;
  relationship: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const requestData: NudgeReminderRequest = await req.json();
    const { 
      recipientEmail, 
      recipientName, 
      senderName, 
      senderUserId, 
      nudgeMethod, 
      customMessage,
      connectionId,
      relationship 
    } = requestData;

    console.log("📧 Processing nudge reminder:", {
      recipientEmail,
      recipientName,
      senderName,
      nudgeMethod,
      relationship
    });

    // Validate required fields
    if (!recipientEmail || !recipientName || !senderName || !senderUserId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user can send nudge (rate limiting)
    const { data: canSend, error: canSendError } = await supabase.rpc('can_send_nudge', {
      p_user_id: senderUserId,
      p_recipient_email: recipientEmail
    });

    if (canSendError) {
      console.error("Error checking nudge permissions:", canSendError);
      return new Response(
        JSON.stringify({ error: "Failed to check nudge permissions" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!canSend) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded or maximum nudges reached" }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get current nudge count for this connection
    const { data: nudgeData } = await supabase.rpc('get_nudge_summary', {
      p_user_id: senderUserId,
      p_recipient_email: recipientEmail
    });

    const currentNudgeCount = nudgeData && nudgeData.length > 0 ? nudgeData[0].total_nudges : 0;

    // Create signup link for the recipient
    const signupLink = `https://dmkxtkvlispxeqfzlczr.supabase.co/auth/v1/verify?token=signup&type=signup&redirect_to=${encodeURIComponent('https://dmkxtkvlispxeqfzlczr.supabase.co/streamlined-signup')}`;

    // Send email nudge
    let emailSent = false;
    let smsSent = false;

    if (nudgeMethod === 'email' || nudgeMethod === 'both') {
      try {
        const nudgeSubject = currentNudgeCount === 0 
          ? `${senderName} sent you a gift invitation!`
          : `Reminder: ${senderName} is waiting for you to join!`;

        const emailResponse = await resend.emails.send({
          from: "Gift Invitations <gifts@elyphant.com>",
          to: [recipientEmail],
          subject: nudgeSubject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="margin: 0; font-size: 28px;">🎁 Gift Invitation ${currentNudgeCount > 0 ? 'Reminder' : ''}</h1>
                <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">From ${senderName}</p>
              </div>
              
              <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <h2 style="color: #333; margin-top: 0;">Hi ${recipientName}! 👋</h2>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #555;">
                    ${customMessage.replace(/\n/g, '<br>')}
                  </p>
                </div>
                
                ${currentNudgeCount > 0 ? `
                  <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; color: #856404; font-size: 14px;">
                      <strong>Friendly reminder:</strong> This is nudge #${currentNudgeCount + 1} of 3. ${senderName} is really excited to connect with you!
                    </p>
                  </div>
                ` : ''}
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${signupLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    Accept Gift Invitation
                  </a>
                </div>
                
                <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                  <p style="font-size: 14px; color: #666; margin: 0;">
                    <strong>What happens next?</strong><br>
                    1. Click the button above to join our platform<br>
                    2. Complete your profile setup<br>
                    3. See what ${senderName} has planned for you!
                  </p>
                </div>
                
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                  <p style="font-size: 12px; color: #999; margin: 0;">
                    This invitation was sent by ${senderName} through our gift platform.
                    <br>If you don't want to receive these reminders, please reply to this email.
                  </p>
                </div>
              </div>
            </div>
          `,
        });

        if (emailResponse.error) {
          console.error("Email send error:", emailResponse.error);
        } else {
          emailSent = true;
          console.log("✅ Email nudge sent successfully");
        }
      } catch (error) {
        console.error("Error sending email nudge:", error);
      }
    }

    // TODO: Add SMS nudge functionality here when Twilio is set up
    if (nudgeMethod === 'sms' || nudgeMethod === 'both') {
      // SMS functionality would go here
      console.log("📱 SMS nudging not yet implemented");
      smsSent = false; // Set to true when SMS is implemented
    }

    // Record the nudge in the database
    const { error: insertError } = await supabase
      .from('connection_nudges')
      .insert({
        user_id: senderUserId,
        recipient_email: recipientEmail,
        connection_id: connectionId,
        nudge_type: 'manual',
        nudge_method: nudgeMethod,
        nudge_count: currentNudgeCount + 1,
        custom_message: customMessage,
        delivery_status: (emailSent || smsSent) ? 'sent' : 'failed',
        last_nudge_sent_at: new Date().toISOString()
      });

    if (insertError) {
      console.error("Error recording nudge:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to record nudge" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("✅ Nudge reminder completed successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailSent, 
        smsSent,
        nudgeCount: currentNudgeCount + 1
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );

  } catch (error) {
    console.error("Error in send-nudge-reminder:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);