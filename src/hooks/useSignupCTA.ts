import { useState, useEffect } from "react";

interface UseSignupCTAProps {
  profileName: string;
  isSharedProfile: boolean;
}

export const useSignupCTA = ({ profileName, isSharedProfile }: UseSignupCTAProps) => {
  const [shouldShowCTA, setShouldShowCTA] = useState(false);

  useEffect(() => {
    if (!isSharedProfile) {
      setShouldShowCTA(false);
      return;
    }

    // Check if user has already dismissed CTA for this session
    const dismissedCTA = sessionStorage.getItem(`dismissedCTA_${profileName}`);
    
    if (!dismissedCTA) {
      // Show CTA after a short delay to let the page load
      const timer = setTimeout(() => {
        setShouldShowCTA(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isSharedProfile, profileName]);

  const dismissCTA = () => {
    setShouldShowCTA(false);
    sessionStorage.setItem(`dismissedCTA_${profileName}`, 'true');
  };

  return {
    shouldShowCTA,
    dismissCTA
  };
};