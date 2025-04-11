
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const useAuthFunctions = (user: User | null) => {
  const navigate = useNavigate();

  const signOut = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
      navigate("/");
      toast.success("You have been signed out");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    }
  };

  const deleteUser = async (): Promise<void> => {
    if (!user) {
      toast.error("No user logged in");
      return;
    }

    try {
      // Delete user account
      const { error } = await supabase.rpc('delete_user');
      
      if (error) throw error;
      
      // Sign out after deletion
      await supabase.auth.signOut();
      
      // Redirect to home page
      navigate("/");
      toast.success("Your account has been deleted");
    } catch (error) {
      console.error("Error deleting user account:", error);
      toast.error("Failed to delete your account");
      throw error;
    }
  };

  return {
    signOut,
    deleteUser
  };
};
