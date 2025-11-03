import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useAuthFunctions = (user: any) => {
  const signOut = async () => {
    try {
      // Log security event before sign out
      if (user?.id) {
        await supabase.from('security_logs').insert({
          user_id: user.id,
          event_type: 'user_signout',
          details: {
            timestamp: new Date().toISOString(),
            manual_signout: true
          },
          user_agent: navigator.userAgent,
          risk_level: 'low'
        });
      }
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // COMPREHENSIVE CLEANUP: Clear ALL localStorage except preferences
      const theme = localStorage.getItem("theme");
      const language = localStorage.getItem("language");
      
      // Clear all data
      localStorage.clear();
      sessionStorage.clear();
      
      // Restore preferences
      if (theme) localStorage.setItem("theme", theme);
      if (language) localStorage.setItem("language", language);
      
      toast.success("You have been signed out");
      
      // Force page reload to clear memory state
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
      
    } catch (error: any) {
      console.error("Error signing out:", error.message);
      toast.error("Failed to sign out");
    }
  };

  const deleteUser = async () => {
    if (!user) {
      toast.error("No user is currently logged in");
      return;
    }

    try {
      toast.loading("Deleting account...");
      
      // Use the secure edge function to delete user account
      const { data, error } = await supabase.functions.invoke('delete-user-account', {
        method: 'POST'
      });
      
      if (error) throw error;
      
      // Sign out and clear data
      await supabase.auth.signOut();
      localStorage.clear();
      
      toast.dismiss();
      toast.success("Your account has been deleted");
      
      // The auth state change will trigger navigation in components that have access to Router context
    } catch (error: any) {
      toast.dismiss();
      console.error("Error deleting account:", error.message);
      toast.error("Failed to delete account");
    }
  };

  return { signOut, deleteUser };
};