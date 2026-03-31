import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse optional target_email from request body
    let targetEmail: string | null = null;
    try {
      const body = await req.json();
      targetEmail = body?.target_email || null;
    } catch {
      // No body or invalid JSON — process all testers (cron mode)
    }

    console.log(`📧 Beta check-in emailer started${targetEmail ? ` (target: ${targetEmail})` : ' (all testers)'}`);

    let uniqueUserIds: string[];

    if (targetEmail) {
      // Single-tester mode: look up user by email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', targetEmail.trim())
        .single();

      if (profileError || !profile) {
        return new Response(
          JSON.stringify({ success: false, error: `No user found with email: ${targetEmail}` }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify they're a beta tester (have issued credits)
      const { data: credits } = await supabase
        .from('beta_credits')
        .select('id')
        .eq('user_id', profile.id)
        .eq('type', 'issued')
        .limit(1);

      if (!credits || credits.length === 0) {
        return new Response(
          JSON.stringify({ success: false, error: `${targetEmail} is not an active beta tester` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      uniqueUserIds = [profile.id];
    } else {
      // Bulk mode: get all active beta testers
      const { data: testers, error: testerError } = await supabase
        .from('beta_credits')
        .select('user_id')
        .eq('type', 'issued');

      if (testerError) throw testerError;

      uniqueUserIds = [...new Set((testers || []).map((t: any) => t.user_id))];
    }

    console.log(`Found ${uniqueUserIds.length} tester(s) to email`);

    if (uniqueUserIds.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No testers to email' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get tester analytics for personalization
    const { data: analyticsData, error: analyticsError } = await supabase.rpc('get_beta_tester_analytics');
    if (analyticsError) {
      console.error('Failed to get analytics:', analyticsError);
    }

    const analytics = analyticsData as any;
    const testerMap = new Map<string, any>();
    if (analytics?.per_tester) {
      for (const t of analytics.per_tester) {
        testerMap.set(t.user_id, t);
      }
    }

    // Get app URL for feedback links
    const appUrl = Deno.env.get('APP_URL') || 'https://elyphant.ai';

    let sent = 0;
    let failed = 0;

    for (const userId of uniqueUserIds) {
      try {
        // Generate feedback token (7-day expiry)
        const { data: tokenData, error: tokenError } = await supabase
          .from('beta_feedback_tokens')
          .insert({
            user_id: userId,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .select('token')
          .single();

        if (tokenError) {
          console.error(`Failed to create token for ${userId}:`, tokenError);
          failed++;
          continue;
        }

        const testerData = testerMap.get(userId);
        const feedbackUrl = `${appUrl}/beta-feedback?token=${tokenData.token}`;

        // Build personalized data
        const emailData = {
          recipient_name: testerData?.name || 'Beta Tester',
          feedback_url: feedbackUrl,
          has_wishlist: testerData?.has_wishlist || false,
          has_invited: testerData?.has_invited || false,
          has_scheduled_gift: testerData?.has_scheduled_gift || false,
          has_purchased: testerData?.has_purchased || false,
          wishlist_count: testerData?.wishlist_count || 0,
          order_count: testerData?.order_count || 0,
          features_used: testerData?.features_used || 0,
        };

        // Get tester's email
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', userId)
          .single();

        if (!profile?.email) {
          console.error(`No email for user ${userId}`);
          failed++;
          continue;
        }

        // Send via orchestrator
        await supabase.functions.invoke('ecommerce-email-orchestrator', {
          body: {
            eventType: 'beta_checkin',
            recipientEmail: profile.email,
            data: emailData,
          },
        });

        sent++;
        console.log(`✅ Check-in sent to ${profile.email}`);
      } catch (err) {
        console.error(`Failed to process tester ${userId}:`, err);
        failed++;
      }
    }

    console.log(`📧 Check-in complete: ${sent} sent, ${failed} failed`);

    return new Response(
      JSON.stringify({ success: true, sent, failed, total: uniqueUserIds.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Beta check-in emailer error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
