
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";
import { getSupabaseClient } from "../utils/supabase.ts";

/**
 * Update user's email confirmation status
 */
export async function confirmUserEmail(email: string): Promise<void> {
  const supabase = getSupabaseClient();
  
  const { data: userData, error: userError } = await supabase.auth
    .admin
    .getUserByEmail(email);
  
  if (userError) {
    console.error("Error fetching user:", userError);
    return;
  }
  
  if (userData?.user) {
    console.log("Setting user email as confirmed:", userData.user.id);
    const { error: updateError } = await supabase.auth
      .admin
      .updateUserById(userData.user.id, {
        email_confirm: true
      });
    
    if (updateError) {
      console.error("Error updating user's email confirmation status:", updateError);
    }
  }
}
