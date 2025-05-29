
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth";

interface UseSignupCTAProps {
  profileName: string;
  isSharedProfile?: boolean;
}

export const useSignupCTA = ({ profileName, isSharedProfile = false }: UseSignupCTAProps) => {
  const { user } = useAuth();
  const [shouldShowCTA, setShouldShowCTA] = useState(false);

  useEffect(() => {
    // Don't show CTA if user is authenticated
    if (user) {
      setShouldShowCTA(false);
      return;
    }

    // Only show on shared profiles
    if (!isSharedProfile) {
      setShouldShowCTA(false);
      return;
    }

    // Check if we've already shown this CTA in this session
    const hasShownCTA = sessionStorage.getItem('elyphant-signup-cta-shown');
    if (hasShownCTA) {
      setShouldShowCTA(false);
      return;
    }

    setShouldShowCTA(true);
  }, [user, isSharedProfile]);

  const dismissCTA = () => {
    setShouldShowCTA(false);
  };

  return {
    shouldShowCTA,
    dismissCTA
  };
};
