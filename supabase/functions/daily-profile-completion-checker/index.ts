import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProfileCompletionData {
  id: string;
  name: string;
  email: string;
  created_at: string;
  gift_preferences: any[];
  important_dates: any[];
  shipping_address: any;
  data_sharing_settings: any;
}

// Calculate profile completion score based on existing useProfileDataIntegrity logic
function calculateCompletionScore(profile: ProfileCompletionData): {
  score: number;
  missingElements: string[];
} {
  let score = 0;
  const missingElements: string[] = [];
  const totalElements = 5;

  // Basic info (name)
  if (profile.name && profile.name.trim()) {
    score += 20;
  } else {
    missingElements.push("name");
  }

  // Gift preferences
  if (profile.gift_preferences && profile.gift_preferences.length > 0) {
    score += 20;
  } else {
    missingElements.push("interests");
  }

  // Important dates
  if (profile.important_dates && profile.important_dates.length > 0) {
    score += 20;
  } else {
    missingElements.push("events");
  }

  // Shipping address
  if (profile.shipping_address && 
      typeof profile.shipping_address === 'object' && 
      profile.shipping_address.address_line1) {
    score += 20;
  } else {
    missingElements.push("address");
  }

  // Data sharing settings
  if (profile.data_sharing_settings && 
      typeof profile.data_sharing_settings === 'object') {
    score += 20;
  } else {
    missingElements.push("preferences");
  }

  return { score, missingElements };
}

function determineEmailCampaignStage(
  profileAge: number, 
  lastEmailSent: string | null,
  score: number
): string | null {
  const now = new Date();
  const daysSinceCreation = Math.floor(profileAge / (1000 * 60 * 60 * 24));
  
  // Don't send if profile is complete enough
  if (score >= 80) return null;

  // Check if we've sent an email recently
  if (lastEmailSent) {
    const lastEmailDate = new Date(lastEmailSent);
    const daysSinceLastEmail = Math.floor((now.getTime() - lastEmailDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Don't send emails too frequently
    if (daysSinceLastEmail < 2) return null;
  }

  // Determine which email to send based on profile age
  if (daysSinceCreation === 1) {
    return "profile_reminder_welcome";
  } else if (daysSinceCreation === 3) {
    return "profile_reminder_interests";
  } else if (daysSinceCreation === 7) {
    return "profile_reminder_events";
  } else if (daysSinceCreation === 14) {
    return "profile_reminder_final";
  }

  return null;
}

async function scheduleProfileCompletionEmail(
  userId: string,
  email: string,
  name: string,
  emailType: string,
  completionScore: number,
  missingElements: string[]
) {
  console.log(`Scheduling ${emailType} email for user ${userId} (${email})`);

  // Get email template
  const { data: template } = await supabase
    .from("email_templates")
    .select("*")
    .eq("template_type", emailType)
    .eq("is_active", true)
    .single();

  if (!template) {
    console.error(`No active template found for ${emailType}`);
    return;
  }

  // Prepare template variables
  const baseUrl = Deno.env.get("SITE_URL") || "https://dmkxtkvlispxeqfzlczr.supabase.co";
  const templateVariables = {
    recipient_name: name || "there",
    completion_percentage: completionScore.toString(),
    dashboard_url: `${baseUrl}/dashboard`,
    interests_url: `${baseUrl}/dashboard?focus=interests`,
    events_url: `${baseUrl}/dashboard?focus=events`,
    unsubscribe_url: `${baseUrl}/email-preferences`,
    missing_interests: missingElements.includes("interests"),
    missing_events: missingElements.includes("events"),
    missing_address: missingElements.includes("address"),
    missing_preferences: missingElements.includes("preferences")
  };

  // Schedule email in queue
  const { error: queueError } = await supabase
    .from("email_queue")
    .insert({
      recipient_email: email,
      recipient_name: name || null,
      template_id: template.id,
      template_variables: templateVariables,
      scheduled_for: new Date().toISOString(),
      status: "pending"
    });

  if (queueError) {
    console.error("Error queueing email:", queueError);
    return;
  }

  // Update or insert analytics record
  const { error: analyticsError } = await supabase
    .from("profile_completion_analytics")
    .upsert({
      user_id: userId,
      completion_score: completionScore,
      missing_elements: missingElements,
      email_campaign_stage: emailType,
      last_email_sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: "user_id"
    });

  if (analyticsError) {
    console.error("Error updating analytics:", analyticsError);
  }

  console.log(`Successfully scheduled ${emailType} email for ${email}`);
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting daily profile completion check...");

    // Get all users with their profile data and email preferences
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select(`
        id, name, email, created_at, gift_preferences, 
        important_dates, shipping_address, data_sharing_settings
      `);

    if (profilesError) {
      throw new Error(`Error fetching profiles: ${profilesError.message}`);
    }

    console.log(`Found ${profiles?.length} profiles to check`);

    let emailsScheduled = 0;
    let usersProcessed = 0;

    for (const profile of profiles || []) {
      try {
        usersProcessed++;

        // Check if user has opted out of profile completion emails
        const { data: emailPrefs } = await supabase
          .from("email_preferences")
          .select("is_enabled")
          .eq("user_id", profile.id)
          .eq("email_type", "profile_completion_reminders")
          .single();

        if (emailPrefs && !emailPrefs.is_enabled) {
          console.log(`User ${profile.id} has opted out of profile completion emails`);
          continue;
        }

        // Calculate completion score
        const { score, missingElements } = calculateCompletionScore(profile);
        
        // Get existing analytics
        const { data: analytics } = await supabase
          .from("profile_completion_analytics")
          .select("last_email_sent_at, email_campaign_stage")
          .eq("user_id", profile.id)
          .single();

        // Determine if we should send an email
        const createdAt = new Date(profile.created_at);
        const profileAge = Date.now() - createdAt.getTime();
        
        const emailStage = determineEmailCampaignStage(
          profileAge,
          analytics?.last_email_sent_at || null,
          score
        );

        if (emailStage && profile.email) {
          await scheduleProfileCompletionEmail(
            profile.id,
            profile.email,
            profile.name,
            emailStage,
            score,
            missingElements
          );
          emailsScheduled++;
        }

        // Update analytics even if no email sent (for tracking)
        if (!analytics) {
          await supabase
            .from("profile_completion_analytics")
            .insert({
              user_id: profile.id,
              completion_score: score,
              missing_elements: missingElements,
              updated_at: new Date().toISOString()
            });
        }

      } catch (userError) {
        console.error(`Error processing user ${profile.id}:`, userError);
        continue;
      }
    }

    const result = {
      success: true,
      usersProcessed,
      emailsScheduled,
      timestamp: new Date().toISOString()
    };

    console.log("Profile completion check completed:", result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error: any) {
    console.error("Error in daily profile completion checker:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  }
};

serve(handler);