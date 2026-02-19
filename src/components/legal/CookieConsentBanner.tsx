import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { useCookieConsent } from "@/hooks/useCookieConsent";

const CookieConsentBanner: React.FC = () => {
  const { showBanner, acceptAll, acceptEssential } = useCookieConsent();
  const [expanded, setExpanded] = useState(false);

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-border pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))] lg:bottom-6 lg:left-1/2 lg:-translate-x-1/2 lg:right-auto lg:w-full lg:max-w-2xl lg:rounded-xl lg:border lg:border-border lg:shadow-sm lg:pb-0"
          role="dialog"
          aria-label="Cookie consent"
          aria-live="polite"
        >
          <div className="px-4 py-3 lg:max-w-none lg:px-5 lg:py-4">
            {/* Mobile/tablet: stack vertically. Desktop (lg): single row */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
              {/* Text block */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm">
                  We use essential cookies
                </p>
                <p className="text-muted-foreground text-xs mt-0.5 leading-relaxed">
                  Only cookies required for authentication and security — no advertising or tracking.{" "}
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="text-foreground underline underline-offset-2 inline-flex items-center gap-0.5 text-xs font-medium py-2 touch-manipulation active:opacity-70"
                  >
                    {expanded ? "Less info" : "More info"}
                    {expanded ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </button>
                </p>

                <AnimatePresence>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 space-y-1.5 text-xs text-muted-foreground bg-muted border border-border rounded-md p-3">
                        <div>
                          <span className="font-medium text-foreground">Essential cookies</span>{" "}
                          — Required for login, session management, and security. Always active.
                        </div>
                        <div>
                          <span className="font-medium text-foreground">Analytics cookies</span>{" "}
                          — We do not currently use analytics or advertising cookies.
                        </div>
                        <div>
                          <a href="/privacy-policy" className="text-foreground underline underline-offset-2">
                            Read our full Privacy Policy →
                          </a>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Actions — full width row on mobile, inline on desktop */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={acceptAll}
                  className="flex-1 lg:flex-none bg-foreground text-background text-xs font-medium h-11 px-4 rounded-full hover:bg-foreground/90 active:bg-foreground/80 active:scale-95 transition-colors touch-manipulation whitespace-nowrap"
                >
                  Accept All
                </button>
                <button
                  onClick={acceptEssential}
                  className="flex-1 lg:flex-none border border-border text-foreground bg-white text-xs font-medium h-11 px-4 rounded-full hover:bg-muted active:bg-muted/80 active:scale-95 transition-colors touch-manipulation whitespace-nowrap"
                >
                  Essential Only
                </button>
                <button
                  onClick={acceptEssential}
                  className="flex items-center justify-center min-w-[44px] min-h-[44px] text-muted-foreground ml-1 shrink-0 touch-manipulation active:opacity-70"
                  aria-label="Dismiss cookie banner"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsentBanner;
