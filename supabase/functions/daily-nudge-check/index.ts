import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PendingConnection {
  id: string;
  user_id: string;
  recipient_email: string;
  recipient_name: string;
  sender_name: string;
  relationship: string;
  created_at: string;
  invitation_data: any;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("🔄 Starting daily nudge check...");

    // Get all pending connections that might need nudges
    const { data: pendingConnections, error: fetchError } = await supabase
      .from('pending_gift_invitations')
      .select('*')
      .eq('status', 'pending_invitation');

    if (fetchError) {
      console.error("Error fetching pending connections:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch pending connections" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`📋 Found ${pendingConnections?.length || 0} pending connections`);

    if (!pendingConnections || pendingConnections.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending connections to process" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let nudgesSent = 0;
    let errors: string[] = [];

    // Process each pending connection
    for (const connection of pendingConnections) {
      try {
        const createdAt = new Date(connection.created_at);
        const now = new Date();
        const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

        // Get existing nudges for this connection
        const { data: nudgeData } = await supabase.rpc('get_nudge_summary', {
          p_user_id: connection.user_id,
          p_recipient_email: connection.recipient_email
        });

        const nudgeInfo = nudgeData && nudgeData.length > 0 ? nudgeData[0] : {
          total_nudges: 0,
          last_nudge_sent: null,
          can_nudge: true,
          days_until_next_nudge: 0
        };

        // Determine if we should send a nudge based on our schedule
        let shouldSendNudge = false;
        let nudgeReason = '';

        if (nudgeInfo.total_nudges === 0) {
          // First nudge: 3 days after initial invitation
          if (daysSinceCreation >= 3) {
            shouldSendNudge = true;
            nudgeReason = 'First automated nudge (3 days after invitation)';
          }
        } else if (nudgeInfo.total_nudges === 1) {
          // Second nudge: 7 days after first nudge
          const lastNudge = new Date(nudgeInfo.last_nudge_sent);
          const daysSinceLastNudge = Math.floor((now.getTime() - lastNudge.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysSinceLastNudge >= 7) {
            shouldSendNudge = true;
            nudgeReason = 'Second automated nudge (7 days after first nudge)';
          }
        } else if (nudgeInfo.total_nudges === 2) {
          // Final nudge: 14 days after second nudge
          const lastNudge = new Date(nudgeInfo.last_nudge_sent);
          const daysSinceLastNudge = Math.floor((now.getTime() - lastNudge.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysSinceLastNudge >= 14) {
            shouldSendNudge = true;
            nudgeReason = 'Final automated nudge (14 days after second nudge)';
          }
        }

        if (!shouldSendNudge || !nudgeInfo.can_nudge) {
          continue;
        }

        console.log(`📤 Sending automated nudge: ${nudgeReason} for ${connection.recipient_email}`);

        // Get sender profile for personalization
        const { data: senderProfile } = await supabase
          .from('profiles')
          .select('name, first_name, last_name')
          .eq('id', connection.user_id)
          .single();

        const senderName = senderProfile?.name || senderProfile?.first_name || 'Your friend';

        // Create personalized message based on nudge number
        let automaticMessage = '';
        if (nudgeInfo.total_nudges === 0) {
          automaticMessage = `Hi ${connection.recipient_name}! 👋

${senderName} sent you a gift invitation a few days ago and I wanted to make sure you didn't miss it.

I think you'll really enjoy what they have planned for you! It only takes a minute to join and see what's waiting.`;
        } else if (nudgeInfo.total_nudges === 1) {
          automaticMessage = `Hi ${connection.recipient_name}! 

${senderName} is still excited to connect with you through our gift platform. 

This is just a gentle reminder about the gift invitation they sent. No pressure, but it would mean a lot to them if you could take a moment to check it out.`;
        } else {
          automaticMessage = `Hi ${connection.recipient_name}! 

This is the final reminder about ${senderName}'s gift invitation. 

They've been looking forward to connecting with you and sharing something special. If you're interested, now would be a great time to join!`;
        }

        // Create signup link
        const signupLink = `https://dmkxtkvlispxeqfzlczr.supabase.co/auth/v1/verify?token=signup&type=signup&redirect_to=${encodeURIComponent('https://dmkxtkvlispxeqfzlczr.supabase.co/streamlined-signup')}`;

        // Send email via send-email-notification function
        const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-email-notification', {
          body: {
            type: 'gift_invitation_nudge',
            to: connection.recipient_email,
            data: {
              senderName,
              recipientName: connection.recipient_name,
              signupLink,
              automaticMessage,
              nudgeNumber: nudgeInfo.total_nudges + 1
            }
          }
        });

        if (emailError) {
          console.error(`Error sending email to ${connection.recipient_email}:`, emailError);
          errors.push(`Failed to send email to ${connection.recipient_email}: ${emailError.message}`);
        } else {
          // Record the nudge in the database
          const { error: insertError } = await supabase
            .from('connection_nudges')
            .insert({
              user_id: connection.user_id,
              recipient_email: connection.recipient_email,
              connection_id: connection.id,
              nudge_type: 'automated',
              nudge_method: 'email',
              nudge_count: nudgeInfo.total_nudges + 1,
              custom_message: automaticMessage,
              delivery_status: 'sent',
              last_nudge_sent_at: new Date().toISOString()
            });

          if (insertError) {
            console.error(`Error recording nudge for ${connection.recipient_email}:`, insertError);
            errors.push(`Failed to record nudge for ${connection.recipient_email}: ${insertError.message}`);
          } else {
            nudgesSent++;
            console.log(`✅ Automated nudge sent to ${connection.recipient_email}`);
          }
        }

      } catch (error) {
        console.error(`Error processing connection ${connection.id}:`, error);
        errors.push(`Error processing connection ${connection.id}: ${error.message}`);
      }
    }

    console.log(`🎯 Daily nudge check completed. Sent ${nudgesSent} nudges.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        nudgesSent, 
        errors: errors.length > 0 ? errors : null,
        processedConnections: pendingConnections.length
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );

  } catch (error) {
    console.error("Error in daily-nudge-check:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);