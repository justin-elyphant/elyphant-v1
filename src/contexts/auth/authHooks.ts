import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useAuthFunctions = (user: any) => {
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast.success("You have been signed out");
      
      // Clear any user-related localStorage items and old modal flags
      localStorage.removeItem("userId");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userName");
      localStorage.removeItem("modalCurrentStep");
      localStorage.removeItem("modalInSignupFlow");
      localStorage.removeItem("modalForceOpen");
      localStorage.removeItem("modalTargetStep");
      localStorage.removeItem("profileCompletionState");
      localStorage.removeItem("onboardingStep");
      localStorage.removeItem("signupFlowActive");
      
      // The auth state change will trigger navigation in components that have access to Router context
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
      
      // Delete user account
      const { error } = await supabase.auth.admin.deleteUser(user.id);
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