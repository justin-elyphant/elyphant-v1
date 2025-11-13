import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔄 Starting invitation reminder check...');

    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Get pending invitations that need reminders
    const { data: pendingInvitations, error } = await supabase
      .from('user_connections')
      .select(`
        id,
        user_id,
        pending_recipient_email,
        pending_recipient_name,
        invitation_sent_at,
        invitation_reminder_count,
        last_reminder_sent_at,
        profiles!user_connections_user_id_fkey(name, first_name)
      `)
      .eq('status', 'pending_invitation')
      .lt('invitation_reminder_count', 3);

    if (error) {
      console.error('❌ Error fetching pending invitations:', error);
      throw error;
    }

    console.log(`📊 Found ${pendingInvitations?.length || 0} pending invitations to check`);

    let remindersSent = 0;
    let shopperNotificationsSent = 0;

    for (const invitation of pendingInvitations || []) {
      const invitationDate = new Date(invitation.invitation_sent_at);
      const lastReminderDate = invitation.last_reminder_sent_at ? new Date(invitation.last_reminder_sent_at) : null;
      const reminderCount = invitation.invitation_reminder_count || 0;

      let shouldSendReminder = false;
      let reminderDay = 0;

      // Check if we should send a reminder
      if (reminderCount === 0 && invitationDate <= threeDaysAgo) {
        shouldSendReminder = true;
        reminderDay = 3;
      } else if (reminderCount === 1 && invitationDate <= sevenDaysAgo) {
        shouldSendReminder = true;
        reminderDay = 7;
      } else if (reminderCount === 2 && invitationDate <= fourteenDaysAgo) {
        shouldSendReminder = true;
        reminderDay = 14;
      }

      if (shouldSendReminder) {
        console.log(`📧 Sending reminder ${reminderCount + 1} for ${invitation.pending_recipient_email}`);

        const senderName = invitation.profiles?.first_name || invitation.profiles?.name || 'Someone';

        // Send reminder email to recipient
        const { error: emailError } = await supabase.functions.invoke('ecommerce-email-orchestrator', {
          body: {
            eventType: 'connection_invitation',
            recipientEmail: invitation.pending_recipient_email,
            data: {
              sender_name: senderName,
              recipient_name: invitation.pending_recipient_name,
              invitation_url: `https://elyphant.ai/auth?invite=${invitation.id}`,
              is_reminder: true,
              reminder_number: reminderCount + 1
            }
          }
        });

        if (emailError) {
          console.error('❌ Failed to send reminder email:', emailError);
        } else {
          // Update invitation with reminder info
          await supabase
            .from('user_connections')
            .update({
              invitation_reminder_count: reminderCount + 1,
              last_reminder_sent_at: now.toISOString()
            })
            .eq('id', invitation.id);

          remindersSent++;
        }

        // Send shopper notification on day 7
        if (reminderDay === 7) {
          console.log(`📧 Sending shopper notification for ${invitation.pending_recipient_email}`);

          const { error: shopperEmailError } = await supabase.functions.invoke('ecommerce-email-orchestrator', {
            body: {
              eventType: 'nudge_reminder',
              data: {
                shopper_user_id: invitation.user_id,
                recipient_email: invitation.pending_recipient_email,
                recipient_name: invitation.pending_recipient_name,
                days_since_invitation: 7
              }
            }
          });

          if (!shopperEmailError) {
            shopperNotificationsSent++;
          }
        }
      }
    }

    console.log(`✅ Sent ${remindersSent} reminders and ${shopperNotificationsSent} shopper notifications`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        remindersSent,
        shopperNotificationsSent,
        totalChecked: pendingInvitations?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in send-invitation-reminders:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});