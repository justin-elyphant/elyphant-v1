
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";

export const useProfileRetrieval = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Fetching profile data for user:", user.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error) throw error;
      
      console.log("Retrieved profile data:", data);
      setProfileData(data);
    } catch (err) {
      console.error("Error retrieving profile:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      toast.error("Failed to load profile data");
    } finally {
      setIsLoading(false);
    }
  };

  // Load profile data on component mount
  useEffect(() => {
    fetchProfile();
  }, [user]);

  return {
    profileData,
    isLoading,
    error,
    fetchProfile
  };
};
