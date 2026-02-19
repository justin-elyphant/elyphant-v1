import { useState } from "react";

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

  // Derive showBanner directly — no effect needed, avoids timing/re-render issues
  const showBanner = consent === null;

  const acceptAll = () => {
    localStorage.setItem(STORAGE_KEY, "all");
    setConsent("all");
  };

  const acceptEssential = () => {
    localStorage.setItem(STORAGE_KEY, "essential");
    setConsent("essential");
  };

  return { consent, showBanner, acceptAll, acceptEssential };
}
