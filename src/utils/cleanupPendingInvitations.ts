import { supabase } from "@/integrations/supabase/client";

/**
 * Cleanup utility to delete pending invitations by email
 * Call from browser console: 
 * import('./utils/cleanupPendingInvitations').then(m => m.cleanupPendingInvitations('heather@example.com'))
 */
export async function cleanupPendingInvitations(recipientEmail: string) {
  console.log(`🧹 Cleaning up pending invitations for ${recipientEmail}...`);
  
  try {
    const { data, error } = await supabase
      .from('user_connections')
      .delete()
      .eq('pending_recipient_email', recipientEmail)
      .eq('status', 'pending_invitation')
      .select();

    if (error) throw error;

    console.log(`✅ Deleted ${data?.length || 0} pending invitations for ${recipientEmail}`);
    return { deleted: data?.length || 0, invitations: data };
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  }
}
