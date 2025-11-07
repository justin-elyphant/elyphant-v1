import { supabase } from "@/integrations/supabase/client";

/**
 * Cleanup utility to delete pending invitations by email
 * Call from browser console: 
 * import('./utils/cleanupPendingInvitations').then(m => m.cleanupPendingInvitations('heather@example.com'))
 */
export async function cleanupPendingInvitations(recipientEmail: string) {
  console.log(`🧹 Cleaning up pending invitations for ${recipientEmail}...`);
  
  try {
    const { data, error } = await supabase.functions.invoke('delete-pending-invitations', {
      body: { recipientEmail }
    });

    if (error) throw error;

    console.log(`✅ Deleted ${data.deleted} pending invitations for ${recipientEmail}`);
    return data;
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  }
}
