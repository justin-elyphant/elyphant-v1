import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useAuthFunctions = (user: any) => {
  const signOut = async () => {
    try {
      // Ensure logged-out view starts with an empty guest cart (preserve user cart)
      localStorage.removeItem('guest_cart');
      localStorage.removeItem('guest_cart_version');
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
      
      // Cart persistence: preserve per-user cart. UnifiedPaymentService switches to guest cart on sign-out.

      // Auth state change will trigger navigation in Router context
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