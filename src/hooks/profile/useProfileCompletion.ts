
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { isProfileComplete } from "@/contexts/auth/authUtils";

export const useProfileCompletion = (redirectToSetup: boolean = true) => {
  const { user, isDebugMode } = useAuth();
  const navigate = useNavigate();
  const [isComplete, setIsComplete] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkProfileCompletion = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      // If in debug mode, just set a default value and skip the API call
      if (isDebugMode) {
        console.log('🔧 Debug mode: Mocking profile completion check');
        setIsComplete(false); // Default to incomplete for testing the flow
        setLoading(false);
        
        if (redirectToSetup) {
          navigate("/profile-setup");
        }
        return;
      }
      
      setLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        
        const complete = isProfileComplete(data);
        setIsComplete(complete);
        
        if (redirectToSetup && !complete) {
          navigate("/profile-setup");
        }
      } catch (err) {
        console.error("Error checking profile completion:", err);
        setIsComplete(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkProfileCompletion();
  }, [user, navigate, redirectToSetup, isDebugMode]);

  return { isComplete, loading };
};
