
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

/**
 * Get Supabase client instance
 */
export function getSupabaseClient() {
  return createClient(supabaseUrl, supabaseServiceKey);
}
