
import { useEffect, useState } from "react";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { validateAndFixProfile } from "@/utils/dataConsistencyChecker";
import { Profile } from "@/types/profile";
import { toast } from "sonner";

export function useConsistentProfile(autoFix: boolean = true) {
  const { profile, loading, error, updateProfile, refetchProfile } = useProfile();
  const [isValidated, setIsValidated] = useState(false);
  const [validationLoading, setValidationLoading] = useState(false);

  // Validate profile on initial load
  useEffect(() => {
    if (profile && !loading && !isValidated) {
      const validateProfile = async () => {
        setValidationLoading(true);
        try {
          const isValid = await validateAndFixProfile(profile, updateProfile, autoFix);
          
          if (!isValid && autoFix) {
            // If validation failed with auto-fix, try refreshing profile data
            await refetchProfile();
          }
        } catch (error) {
          console.error("Error validating profile:", error);
          toast.error("There was an issue loading your profile data");
        } finally {
          setIsValidated(true);
          setValidationLoading(false);
        }
      };

      validateProfile();
    }
  }, [profile, loading, isValidated, autoFix, updateProfile, refetchProfile]);

  const safeProfile = {
    ...profile,
    // Ensure these fields are always safe to access even if profile is incomplete
    gift_preferences: Array.isArray(profile?.gift_preferences) ? profile.gift_preferences : [],
    shipping_address: profile?.shipping_address || {},
    important_dates: Array.isArray(profile?.important_dates) ? profile.important_dates : [],
    data_sharing_settings: profile?.data_sharing_settings || {
      dob: "friends",
      shipping_address: "private",
      gift_preferences: "public",
      email: "private"
    }
  } as Profile;

  return {
    profile: safeProfile,
    loading: loading || validationLoading,
    error,
    isValidated,
    updateProfile,
    refetchProfile
  };
}
