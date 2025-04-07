
import { getSupabaseClient } from "../utils/supabase.ts";

/**
 * Track an invalid verification attempt
 */
export async function trackInvalidAttempt(email: string, code: string): Promise<void> {
  const supabase = getSupabaseClient();
  
  // Find the verification code and increment attempts
  const { data: codeData } = await supabase
    .from("verification_codes")
    .select("id, attempts")
    .eq("email", email)
    .eq("code", code)
    .single();
  
  if (codeData) {
    await supabase
      .from("verification_codes")
      .update({ attempts: codeData.attempts + 1 })
      .eq("id", codeData.id);
  }
}
