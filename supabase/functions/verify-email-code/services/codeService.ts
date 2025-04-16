
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";
import { getSupabaseClient } from "../utils/supabase.ts";

/**
 * Verify a verification code for an email
 */
export async function verifyCode(email: string, code: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    
    // Get the most recent unexpired and unused code for this email
    const { data, error } = await supabase
      .from("verification_codes")
      .select("*")
      .eq("email", email)
      .eq("code", code)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    
    if (error || !data) {
      console.log(`No valid code found for ${email}`);
      return false;
    }
    
    // Mark the code as used
    const { error: updateError } = await supabase
      .from("verification_codes")
      .update({ used: true })
      .eq("id", data.id);
    
    if (updateError) {
      console.error("Error marking code as used:", updateError);
      // Continue anyway - the verification is still valid
    }
    
    return true;
  } catch (error) {
    console.error("Error verifying code:", error);
    return false;
  }
}
