import { useState, useEffect } from "react";

export type CookieConsentLevel = "all" | "essential" | null;

const STORAGE_KEY = "cookie-consent";

export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsentLevel>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored as CookieConsentLevel;
    } catch {
      return null;
    }
  });

  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Only show banner if no consent has been recorded yet
    setShowBanner(consent === null);
  }, [consent]);

  const acceptAll = () => {
    localStorage.setItem(STORAGE_KEY, "all");
    setConsent("all");
    setShowBanner(false);
  };

  const acceptEssential = () => {
    localStorage.setItem(STORAGE_KEY, "essential");
    setConsent("essential");
    setShowBanner(false);
  };

  return { consent, showBanner, acceptAll, acceptEssential };
}
