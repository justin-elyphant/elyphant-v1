import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCookieConsent } from "@/hooks/useCookieConsent";

const CookieConsentBanner: React.FC = () => {
  const { showBanner, acceptAll, acceptEssential } = useCookieConsent();
  const [expanded, setExpanded] = useState(false);

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-[100] pb-safe"
          role="dialog"
          aria-label="Cookie consent"
          aria-live="polite"
        >
          {/* Offset for mobile bottom nav */}
          <div className="mb-16 md:mb-0 mx-4 mb-4">
            <div className="bg-background border border-border rounded-xl shadow-lg p-4 max-w-2xl md:mx-auto">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 rounded-lg p-2 shrink-0">
                  <Cookie className="h-5 w-5 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm">
                    We use essential cookies
                  </p>
                  <p className="text-muted-foreground text-xs mt-0.5 leading-relaxed">
                    We only use cookies required for authentication and security. No advertising or
                    third-party tracking.{" "}
                    <button
                      onClick={() => setExpanded(!expanded)}
                      className="text-primary underline-offset-2 hover:underline inline-flex items-center gap-0.5 text-xs"
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
                        <div className="mt-2 space-y-1.5 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                          <div>
                            <span className="font-medium text-foreground">Essential cookies</span>{" "}
                            — Required for login, session management, and security. Always active.
                          </div>
                          <div>
                            <span className="font-medium text-foreground">Analytics cookies</span>{" "}
                            — We do not currently use analytics or advertising cookies.
                          </div>
                          <div>
                            <a href="/privacy-policy" className="text-primary hover:underline">
                              Read our full Privacy Policy →
                            </a>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex flex-wrap gap-2 mt-3">
                    <Button size="sm" onClick={acceptAll} className="text-xs h-8">
                      Accept All
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={acceptEssential}
                      className="text-xs h-8"
                    >
                      Essential Only
                    </Button>
                  </div>
                </div>

                <button
                  onClick={acceptEssential}
                  className="text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5"
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
