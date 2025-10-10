import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("🎂 Starting birthday email scheduler...");

    // Calculate target date (14 days from now)
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 14);
    const targetMonth = targetDate.getMonth() + 1;
    const targetDay = targetDate.getDate();
    const currentYear = targetDate.getFullYear();

    console.log(`🔍 Looking for birthdays on ${targetMonth}/${targetDay}`);

    // Find users with upcoming birthdays
    const { data: birthdayUsers, error: queryError } = await supabase
      .from('profiles')
      .select('id, email, first_name, name, dob, interests')
      .not('dob', 'is', null)
      .not('email', 'is', null);

    if (queryError) throw queryError;

    // Filter by month/day
    const matchingBirthdays = (birthdayUsers || []).filter(user => {
      const dob = new Date(user.dob);
      return dob.getMonth() + 1 === targetMonth && dob.getDate() === targetDay;
    });

    console.log(`🎉 Found ${matchingBirthdays.length} birthdays on ${targetMonth}/${targetDay}`);

    let queued = 0;
    let skipped = 0;

    for (const birthdayUser of matchingBirthdays) {
      // Check if already sent this year
      const { data: existingTrack } = await supabase
        .from('birthday_email_tracking')
        .select('id')
        .eq('user_id', birthdayUser.id)
        .eq('email_type', 'birthday_reminder_curated')
        .eq('birthday_year', currentYear)
        .single();

      if (existingTrack) {
        console.log(`⏭️ Already sent to ${birthdayUser.email} this year`);
        skipped++;
        continue;
      }

      // Queue birthday person email
      const { data: queuedEmail, error: queueError } = await supabase
        .from('email_queue')
        .insert({
          recipient_email: birthdayUser.email,
          recipient_name: birthdayUser.first_name || birthdayUser.name,
          template_variables: {
            eventType: 'birthday_reminder_curated',
            customData: {
              userId: birthdayUser.id,
              birthdayDate: `${targetMonth}/${targetDay}/${currentYear}`,
              daysUntil: 14
            }
          },
          scheduled_for: new Date(Date.now() + 1000 * 60).toISOString(),
          status: 'pending'
        })
        .select()
        .single();

      if (queueError) {
        console.error(`❌ Failed to queue for ${birthdayUser.email}:`, queueError);
        continue;
      }

      // Track that we queued it
      await supabase
        .from('birthday_email_tracking')
        .insert({
          user_id: birthdayUser.id,
          email_type: 'birthday_reminder_curated',
          birthday_year: currentYear,
          email_queue_id: queuedEmail.id,
          metadata: { scheduled_date: targetDate.toISOString() }
        });

      queued++;
      console.log(`✅ Queued birthday email for ${birthdayUser.email}`);

      // Queue connection reminder emails
      await queueConnectionReminders(supabase, birthdayUser, targetDate, currentYear);
    }

    console.log(`🎯 Birthday scheduler complete: ${queued} queued, ${skipped} skipped`);

    return new Response(JSON.stringify({
      success: true,
      birthdaysFound: matchingBirthdays.length,
      emailsQueued: queued,
      emailsSkipped: skipped
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error: any) {
    console.error("❌ Birthday scheduler error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
};

async function queueConnectionReminders(
  supabase: any,
  birthdayUser: any,
  targetDate: Date,
  currentYear: number
) {
  // Find eligible connections (respecting privacy)
  const { data: connections } = await supabase
    .from('user_connections')
    .select(`
      user_id,
      connected_user_id,
      data_access_permissions
    `)
    .or(`user_id.eq.${birthdayUser.id},connected_user_id.eq.${birthdayUser.id}`)
    .eq('status', 'accepted');

  if (!connections || connections.length === 0) {
    console.log(`  No connections found for ${birthdayUser.email}`);
    return;
  }

  // Filter connections who have permission to see birthday
  const eligibleConnections = connections.filter(conn => {
    const permissions = conn.data_access_permissions || {};
    return permissions.dob === true;
  });

  console.log(`  Found ${eligibleConnections.length} eligible connections`);

  // Check which connections have auto-gifting set up
  const { data: autoGiftRules } = await supabase
    .from('auto_gifting_rules')
    .select('user_id, gift_preferences')
    .eq('recipient_id', birthdayUser.id)
    .eq('is_active', true);

  const hasAutoGift = new Set((autoGiftRules || []).map((r: any) => r.user_id));

  // Queue emails for each connection
  for (const conn of eligibleConnections) {
    const connectionUserId = conn.user_id === birthdayUser.id 
      ? conn.connected_user_id 
      : conn.user_id;

    // Check if already notified this year
    const eventType = hasAutoGift.has(connectionUserId)
      ? 'birthday_connection_with_autogift'
      : 'birthday_connection_no_autogift';

    const { data: existingTrack } = await supabase
      .from('birthday_email_tracking')
      .select('id')
      .eq('user_id', connectionUserId)
      .eq('email_type', eventType)
      .eq('birthday_year', currentYear)
      .single();

    if (existingTrack) {
      console.log(`  ⏭️ Already notified connection ${connectionUserId}`);
      continue;
    }

    // Get connection profile
    const { data: connProfile } = await supabase
      .from('profiles')
      .select('email, first_name, name')
      .eq('id', connectionUserId)
      .single();

    if (!connProfile?.email) continue;

    // Find selected gift if auto-gifting enabled
    let selectedGift = null;
    if (hasAutoGift.has(connectionUserId)) {
      const rule = autoGiftRules.find((r: any) => r.user_id === connectionUserId);
      selectedGift = rule?.gift_preferences;
    }

    // Queue connection email
    const { data: queuedEmail } = await supabase
      .from('email_queue')
      .insert({
        recipient_email: connProfile.email,
        recipient_name: connProfile.first_name || connProfile.name,
        template_variables: {
          eventType,
          customData: {
            connectionUserId,
            birthdayUserName: birthdayUser.first_name || birthdayUser.name,
            birthdayUserId: birthdayUser.id,
            birthdayDate: targetDate.toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric' 
            }),
            daysUntil: 14,
            selectedGift
          }
        },
        scheduled_for: new Date(Date.now() + 1000 * 60).toISOString(),
        status: 'pending'
      })
      .select()
      .single();

    // Track notification
    await supabase
      .from('birthday_email_tracking')
      .insert({
        user_id: connectionUserId,
        email_type: eventType,
        birthday_year: currentYear,
        email_queue_id: queuedEmail.id,
        metadata: { 
          birthday_user_id: birthdayUser.id,
          has_auto_gift: hasAutoGift.has(connectionUserId)
        }
      });

    console.log(`  ✅ Queued ${eventType} for connection ${connProfile.email}`);
  }
}

serve(handler);
