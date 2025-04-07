
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";
import { getSupabaseClient } from "../utils/supabase.ts";
import { isTestCode } from "../utils/validation.ts";

/**
 * Check if a verification code is valid for an email
 */
export const isValidVerificationCode = async (email: string, code: string): Promise<{ 
  valid: boolean; 
  reason?: string;
  codeId?: string;
}> => {
  try {
    console.log(`Checking code ${code} for email ${email}`);
    
    // Enhanced logging for test code detection
    if (isTestCode(code)) {
      console.log(`✅ Test code ${code} detected and accepted in ${Deno.env.get("ENVIRONMENT") || "unknown"} environment`);
      return { valid: true };
    }
    
    // Get the verification code from database
    const codeData = await fetchVerificationCode(email, code);
    
    if (!codeData) {
      console.log("No verification code found for email:", email, "and code:", code);
      
      // Additional debugging: check if there are any recent codes for this email
      await checkRecentCodes(email);
      
      return { valid: false, reason: "invalid" };
    }
    
    console.log("Found verification code:", {
      id: codeData.id,
      expires_at: codeData.expires_at,
      used: codeData.used,
      attempts: codeData.attempts
    });
    
    // Check if code is expired
    if (isCodeExpired(codeData.expires_at)) {
      console.log("Verification code expired for email:", email);
      
      // Update attempts count
      await incrementCodeAttempts(codeData.id);
        
      return { valid: false, reason: "expired" };
    }
    
    console.log("Verification code valid");
    return { valid: true, codeId: codeData.id };
    
  } catch (error) {
    console.error("Error validating code:", error);
    return { valid: false, reason: "error" };
  }
};

/**
 * Fetch verification code from database
 */
async function fetchVerificationCode(email: string, code: string) {
  console.log(`Fetching verification code from DB for email: ${email}, code: ${code}`);
  
  const supabase = getSupabaseClient();
  
  // Normalize email to lowercase for consistency when querying
  const normalizedEmail = email.toLowerCase();
  
  const { data, error } = await supabase
    .from("verification_codes")
    .select("id, code, expires_at, used, attempts")
    .eq("email", normalizedEmail)
    .eq("code", code)
    .eq("used", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  
  if (error) {
    if (error.message.includes('No rows found')) {
      console.log(`No verification code found matching email: ${normalizedEmail} and code: ${code}`);
    } else {
      console.error("Error fetching verification code:", error.message);
    }
    return null;
  }
  
  return data;
}

/**
 * Check if the code has expired
 */
function isCodeExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

/**
 * Mark code as used in the database
 */
export async function markCodeAsUsed(codeId: string): Promise<void> {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase
    .from("verification_codes")
    .update({ used: true })
    .eq("id", codeId);
  
  if (error) {
    console.log("Error updating verification code:", error);
  }
}

/**
 * Increment the attempts count for a code
 */
export async function incrementCodeAttempts(codeId: string): Promise<void> {
  const supabase = getSupabaseClient();
  
  const { data } = await supabase
    .from("verification_codes")
    .select("attempts")
    .eq("id", codeId)
    .single();
    
  if (data) {
    await supabase
      .from("verification_codes")
      .update({ attempts: data.attempts + 1 })
      .eq("id", codeId);
  }
}

/**
 * Check if there are any recent codes for debugging purposes
 */
async function checkRecentCodes(email: string): Promise<void> {
  const supabase = getSupabaseClient();
  
  // Normalize email to lowercase for consistency
  const normalizedEmail = email.toLowerCase();
  
  const { data: recentCodes, error: recentError } = await supabase
    .from("verification_codes")
    .select("id, code, expires_at, created_at, used")
    .eq("email", normalizedEmail)
    .order("created_at", { ascending: false })
    .limit(3);
  
  if (recentCodes?.length) {
    console.log("Recent codes found for this email:", recentCodes.map(c => ({
      id: c.id,
      partialCode: c.code ? `${c.code.substring(0, 2)}...${c.code.substring(4)}` : 'none',
      expires_at: c.expires_at,
      created_at: c.created_at,
      used: c.used
    })));
  } else {
    console.log("No recent codes found for this email");
  }
}
