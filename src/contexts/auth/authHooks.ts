
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const useAuthFunctions = (user: User | null) => {
  const navigate = useNavigate();

  const signOut = async (): Promise<void> => {
    try {
      console.log("Signing out user...");
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Supabase signOut error:", error);
        throw error;
      }
      
      // Clear any local storage items related to authentication
      localStorage.removeItem("userId");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userName");
      localStorage.removeItem("redirectAfterSignIn");
      localStorage.removeItem("newSignUp");
      localStorage.removeItem("nextStepsOption");
      localStorage.removeItem("profileCompleted");
      localStorage.removeItem("fromSignIn");
      localStorage.removeItem("signupRateLimited");
      
      console.log("Sign out successful, redirecting to home page");
      
      // Force a complete page reload to clear any cached state
      setTimeout(() => {
        toast.success("You have been signed out");
        window.location.href = "/";
      }, 500); // Short delay to allow toast to be shown
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
      throw error;
    }
  };

  const deleteUser = async (): Promise<void> => {
    if (!user) {
      toast.error("No user logged in");
      return;
    }

    try {
      toast.loading("Deleting your account...");
      
      // Delete user account
      const { error } = await supabase.rpc('delete_user');
      
      if (error) throw error;
      
      // Sign out after deletion
      await supabase.auth.signOut();
      
      // Clear any local storage items
      localStorage.removeItem("userId");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userName");
      localStorage.removeItem("redirectAfterSignIn");
      localStorage.removeItem("newSignUp");
      localStorage.removeItem("nextStepsOption");
      localStorage.removeItem("profileCompleted");
      
      toast.dismiss();
      toast.success("Your account has been deleted");
      
      // Redirect to home page
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    } catch (error) {
      console.error("Error deleting user account:", error);
      toast.dismiss();
      toast.error("Failed to delete your account");
      throw error;
    }
  };

  return {
    signOut,
    deleteUser
  };
};
