import React, { useState } from "react";
import { Gift, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { triggerHapticFeedback } from "@/utils/haptics";

interface GuestSignupBannerProps {
  className?: string;
}

const GuestSignupBanner: React.FC<GuestSignupBannerProps> = ({ className }) => {
  const { user } = useAuth();
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show for authenticated users or if dismissed
  if (user || isDismissed) {
    return null;
  }

  // Check localStorage for persistence
  if (typeof window !== "undefined") {
    const dismissed = localStorage.getItem("guestSignupBannerDismissed");
    if (dismissed === "true") {
      return null;
    }
  }

  const handleDismiss = () => {
    triggerHapticFeedback('light');
    setIsDismissed(true);
    localStorage.setItem("guestSignupBannerDismissed", "true");
  };

  return (
    <div className={`bg-primary/5 border border-primary/10 rounded-lg p-4 ${className || ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-full">
            <Gift className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium">Track your gift with a free account</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Get delivery updates, save wishlists, and send gifts easily
            </p>
            <div className="flex items-center gap-3 mt-3">
              <Link to="/auth/signup?return=/cart">
                <Button 
                  size="sm" 
                  className="gap-2 min-h-[44px] touch-manipulation active:scale-95 transition-transform"
                  onClick={() => triggerHapticFeedback('medium')}
                >
                  Create Account
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <button
                onClick={handleDismiss}
                className="text-sm text-muted-foreground hover:text-foreground min-h-[44px] px-2 touch-manipulation"
              >
                Continue as Guest
              </button>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 shrink-0 touch-manipulation active:scale-95 transition-transform"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default GuestSignupBanner;
