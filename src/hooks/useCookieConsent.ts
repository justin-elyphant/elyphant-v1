import { useState } from "react";

export type CookieConsentLevel = "all" | "essential" | null;

const STORAGE_KEY = "cookie-consent";

function readStoredConsent(): CookieConsentLevel {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "all" || stored === "essential") return stored;
    return null;
  } catch {
    return null;
  }
}

export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsentLevel>(readStoredConsent);

  // Derive showBanner directly — no effect needed
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
