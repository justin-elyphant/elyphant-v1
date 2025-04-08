
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types/supabase";

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
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error("Error fetching profile:", error);
          setIsComplete(false);
        } else {
          // Check if required fields are present
          const isProfileComplete = !!(
            data.name && 
            data.dob &&
            data.shipping_address &&
            data.gift_preferences && 
            data.gift_preferences.length > 0 &&
            data.data_sharing_settings
          );
          
          setIsComplete(isProfileComplete);
          
          // Redirect to profile setup if needed
          if (shouldRedirect && !isProfileComplete && !isDebugMode) {
            navigate("/profile-setup");
          }
        }
      } catch (err) {
        console.error("Error checking profile completion:", err);
        setIsComplete(false);
      } finally {
        setLoading(false);
      }
    };

    checkProfileCompletion();
  }, [user, navigate, shouldRedirect, isDebugMode]);

  return { isComplete, loading };
};
