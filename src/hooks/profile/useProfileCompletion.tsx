
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useProfileCompletion = (shouldRedirect = true) => {
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const { user, isDebugMode } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    const checkProfileCompletion = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        console.log("Checking profile completion for user:", user.id);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error("Error fetching profile:", error);
          setIsComplete(false);
          
          if (shouldRedirect) {
            console.log("Redirecting to profile setup due to error fetching profile");
            navigate("/profile-setup");
          }
          return;
        }
        
        // Check if required fields are present
        const isProfileComplete = !!(
          data.name && 
          data.dob &&
          data.shipping_address &&
          data.gift_preferences && 
          data.gift_preferences.length > 0 &&
          data.data_sharing_settings
        );
        
        console.log("Profile completion check result:", isProfileComplete);
        setIsComplete(isProfileComplete);
        
        // Redirect to profile setup if needed
        if (shouldRedirect && !isProfileComplete && !isDebugMode) {
          console.log("Redirecting to profile setup");
          navigate("/profile-setup");
        }
      } catch (err) {
        console.error("Error checking profile completion:", err);
        setIsComplete(false);
        
        // Still redirect to profile setup on error
        if (shouldRedirect) {
          navigate("/profile-setup");
        }
      } finally {
        setLoading(false);
      }
    };

    checkProfileCompletion();
  }, [user, navigate, shouldRedirect, isDebugMode]);

  return { isComplete, loading };
};
