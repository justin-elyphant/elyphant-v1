
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Store verification code in database
 */
export async function storeVerificationCode(email: string, code: string): Promise<boolean> {
  try {
    // Check if there's an existing code that's not expired and update resend count
    const { data: existingCode } = await supabase
      .from("verification_codes")
      .select("id, resend_count, last_resend_at")
      .eq("email", email)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (existingCode) {
      return await handleExistingCode(existingCode, email, code);
    } else {
      return await createNewVerificationCode(email, code);
    }
  } catch (error) {
    console.error("Error storing verification code:", error);
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
    console.log(`Rate limiting - last resend was less than 1 minute ago for ${email}`);
    return false;
  }

  // Check resend limit (max 5 per code)
  if (existingCode.resend_count >= 5) {
    console.log(`Resend limit reached (5) for email ${email}`);
    return false;
  }

  // Update the existing record with new resend count
  const { error: updateError } = await supabase
    .from("verification_codes")
    .update({
      code: code,
      resend_count: existingCode.resend_count + 1,
      last_resend_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // Reset expiration
    })
    .eq("id", existingCode.id);
  
  if (updateError) {
    console.error("Error updating verification code:", updateError);
    return false;
  }
  
  return true;
}

/**
 * Create a new verification code record
 */
async function createNewVerificationCode(email: string, code: string): Promise<boolean> {
  const { error: insertError } = await supabase
    .from("verification_codes")
    .insert({
      email: email,
      code: code,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      last_resend_at: new Date().toISOString(),
      resend_count: 0,
    });
  
  if (insertError) {
    console.error("Error inserting verification code:", insertError);
    return false;
  }
  
  return true;
}
