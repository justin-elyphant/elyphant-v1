import { useCallback } from "react";
import { useAuth } from "@/contexts/auth";
import { useRouter } from 'next/navigation';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const useProfileCompletion = (user: any) => {
  const { signOut } = useAuth();
  const { push: navigate } = useRouter();

  const handleSetupComplete = useCallback(async () => {
    if (!user) {
      console.error("No user found, please sign in.");
      toast.error("No user found, please sign in.");
      signOut();
      return;
    }

    // Check if signup is rate limited
    const signupRateLimited = localStorage.getItem("signupRateLimited") === "true";
    if (signupRateLimited) {
      console.warn("Signup is rate limited, please try again later.");
      toast.warn("Signup is rate limited, please try again later.");
      return;
    }

    // Check if profile setup is already loading
    const profileSetupLoading = localStorage.getItem("profileSetupLoading") === "true";
    if (profileSetupLoading) {
      console.warn("Profile setup is already in progress, please wait.");
      toast.warn("Profile setup is already in progress, please wait.");
      return;
    }

    localStorage.setItem("profileSetupLoading", "true");

    try {
      // Make sure we update or create the profile with proper data sharing settings
      const profileUpdate = {
        id: user.id,
        email: user.email,
        data_sharing_settings: {
          dob: "friends",
          shipping_address: "private",
          gift_preferences: "public",
          email: "private"
        }
      };
      
      const { data, error } = await supabase
        .from('profiles')
        .upsert([profileUpdate], { onConflict: 'id' });

      if (error) {
        console.error("Error updating profile:", error);
        toast.error("Failed to update profile. Please try again.");
        localStorage.removeItem("profileSetupLoading");
        return;
      }

      console.log("Profile updated successfully:", data);
      toast.success("Profile setup complete!");
      localStorage.removeItem("profileSetupLoading");
      navigate('/dashboard');

    } catch (error) {
      console.error("Error during profile setup:", error);
      toast.error("An unexpected error occurred. Please try again.");
      localStorage.removeItem("profileSetupLoading");
    }
  }, [user, navigate, signOut]);
  
  const handleSkip = useCallback(() => {
    console.log("Skipping profile setup");
    navigate('/dashboard');
  }, [navigate]);

  const handleBackToDashboard = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  return {
    handleSetupComplete,
    handleSkip,
    handleBackToDashboard
  };
};
