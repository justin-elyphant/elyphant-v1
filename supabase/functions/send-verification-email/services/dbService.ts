
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

/**
 * Database connection manager
 */
function getSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase credentials");
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Store a verification code for an email
 * Returns true if stored successfully, false if there's a rate limit
 */
export async function storeVerificationCode(email: string, code: string): Promise<boolean> {
  try {
    // Always normalize email to lowercase for consistency
    const normalizedEmail = email.toLowerCase();
    
    console.log(`Storing verification code for ${normalizedEmail.substring(0, 3)}...`);
    
    const supabase = getSupabaseClient();
    
    // Check rate limiting - no more than 3 codes in 15 minutes
    const fifteenMinutesAgo = new Date();
    fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);
    
    const { data: recentCodes, error: countError } = await supabase
      .from("verification_codes")
      .select("created_at")
      .eq("email", normalizedEmail)
      .gte("created_at", fifteenMinutesAgo.toISOString())
      .order("created_at", { ascending: false });
    
    if (countError) {
      console.error("Error checking rate limit:", countError);
      // Allow the operation to proceed if we couldn't check the rate limit
    } else if (recentCodes && recentCodes.length >= 3) {
      console.warn(`Rate limit exceeded for ${normalizedEmail}: ${recentCodes.length} codes in the last 15 minutes`);
      return false;
    }
    
    // Create expiry time (30 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);
    
    // Store the verification code
    const { error } = await supabase
      .from("verification_codes")
      .insert({
        email: normalizedEmail,
        code: code,
        expires_at: expiresAt.toISOString(),
      });
    
    if (error) {
      console.error("Error storing verification code:", error);
      return false;
    }
    
    console.log(`Verification code stored successfully for ${normalizedEmail}`);
    return true;
    
  } catch (error) {
    console.error("Error in storeVerificationCode:", error);
    return false;
  }
}

/**
 * Get most recent verification code for an email
 */
export async function getMostRecentCode(email: string): Promise<string | null> {
  try {
    // Always normalize email to lowercase for consistency
    const normalizedEmail = email.toLowerCase();
    
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from("verification_codes")
      .select("code")
      .eq("email", normalizedEmail)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    
    if (error || !data) {
      console.error("Error retrieving verification code:", error);
      return null;
    }
    
    return data.code;
    
  } catch (error) {
    console.error("Error in getMostRecentCode:", error);
    return null;
  }
}
