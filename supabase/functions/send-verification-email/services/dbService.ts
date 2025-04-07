
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Log if critical environment variables are missing
if (!supabaseUrl) {
  console.error("🚨 CRITICAL ERROR: SUPABASE_URL environment variable is not set");
}
if (!supabaseServiceKey) {
  console.error("🚨 CRITICAL ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable is not set");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Store verification code in database
 */
export async function storeVerificationCode(email: string, code: string): Promise<boolean> {
  try {
    console.log(`📝 Attempting to store verification code for ${email}: ${code}`);
    
    // Check if there's an existing code that's not expired and update resend count
    const { data: existingCode, error: queryError } = await supabase
      .from("verification_codes")
      .select("id, resend_count, last_resend_at")
      .eq("email", email)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    
    if (queryError && !queryError.message.includes('No rows found')) {
      console.error("🚨 Database error when checking existing code:", queryError);
      return false;
    }

    if (existingCode) {
      console.log(`🔄 Found existing unused code for ${email}, checking rate limits`);
      return await handleExistingCode(existingCode, email, code);
    } else {
      console.log(`➕ No active code found for ${email}, creating new verification code`);
      return await createNewVerificationCode(email, code);
    }
  } catch (error) {
    console.error("🚨 Unexpected error storing verification code:", error);
    return false;
  }
}

/**
 * Handle existing verification code
 */
async function handleExistingCode(existingCode: any, email: string, code: string): Promise<boolean> {
  // Rate limiting - if last resend was less than 1 minute ago, don't allow
  if (existingCode.last_resend_at && 
      (new Date().getTime() - new Date(existingCode.last_resend_at).getTime() < 60000)) {
    console.log(`⏱️ Rate limiting - last resend was less than 1 minute ago for ${email}`);
    return false;
  }

  // Check resend limit (max 5 per code)
  if (existingCode.resend_count >= 5) {
    console.log(`⚠️ Resend limit reached (5) for email ${email}`);
    return false;
  }

  // Update the existing record with new resend count
  const { error: updateError } = await supabase
    .from("verification_codes")
    .update({
      code: code,  // Update with the new code
      resend_count: existingCode.resend_count + 1,
      last_resend_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // Reset expiration
    })
    .eq("id", existingCode.id);
  
  if (updateError) {
    console.error("🚨 Error updating verification code:", updateError);
    return false;
  }
  
  console.log(`✅ Successfully updated verification code for ${email} - resend count: ${existingCode.resend_count + 1}`);
  return true;
}

/**
 * Create a new verification code record
 */
async function createNewVerificationCode(email: string, code: string): Promise<boolean> {
  try {
    console.log(`🆕 Creating new verification code record for ${email} with code ${code}`);
    
    const { data, error: insertError } = await supabase
      .from("verification_codes")
      .insert({
        email: email,
        code: code,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        last_resend_at: new Date().toISOString(),
        resend_count: 0,
        attempts: 0,
        used: false
      })
      .select();
    
    if (insertError) {
      console.error("🚨 Error inserting verification code:", insertError);
      return false;
    }
    
    console.log(`✅ Successfully created new verification code for ${email}`, data);
    return true;
  } catch (error) {
    console.error("🚨 Error creating verification code:", error);
    return false;
  }
}
