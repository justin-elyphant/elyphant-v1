
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X, Sparkles, Gift, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { triggerHapticFeedback } from "@/utils/haptics";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface GuestWishlistCTAProps {
  ownerName: string;
  className?: string;
}

const GuestWishlistCTA: React.FC<GuestWishlistCTAProps> = ({ 
  ownerName,
  className 
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isDismissed, setIsDismissed] = useState(false);

  // Check session storage for dismissal
  useEffect(() => {
    const dismissed = sessionStorage.getItem('dismissed_wishlist_cta');
    if (dismissed) {
      setIsDismissed(true);
    }
  }, []);

  // Don't show for authenticated users or if dismissed
  if (user || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    triggerHapticFeedback('light');
    sessionStorage.setItem('dismissed_wishlist_cta', 'true');
    setIsDismissed(true);
  };

  const handleCreateWishlist = () => {
    triggerHapticFeedback('medium');
    navigate('/auth?redirect=/wishlists/new');
  };

  const handleLearnMore = () => {
    triggerHapticFeedback('light');
    navigate('/');
  };

  return (
    <AnimatePresence>
      {!isDismissed && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "mt-8 mb-4 relative overflow-hidden",
            "p-5 md:p-6 lg:p-8",
            "bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5",
            "rounded-2xl border border-primary/20",
            "shadow-sm",
            className
          )}
        >
          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className={cn(
              "absolute top-3 right-3 p-1.5 rounded-full",
              "text-muted-foreground hover:text-foreground",
              "hover:bg-background/80 transition-colors",
              "touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
            )}
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Content */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6 pr-8 md:pr-0">
            {/* Text Content */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-full bg-primary/10">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-foreground">
                  Love this idea?
                </h3>
              </div>
              
              <p className="text-sm md:text-base text-muted-foreground max-w-lg">
                Create your own wishlist and share it with friends & family. 
                Never receive an unwanted gift again!
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Button
                variant="outline"
                onClick={handleLearnMore}
                className={cn(
                  "min-h-[44px] px-4",
                  "touch-manipulation active:scale-[0.98] transition-transform",
                  "bg-background/80 hover:bg-background"
                )}
              >
                Learn More
              </Button>
              
              <Button
                onClick={handleCreateWishlist}
                className={cn(
                  "min-h-[44px] px-5",
                  "bg-primary hover:bg-primary/90 text-primary-foreground",
                  "touch-manipulation active:scale-[0.98] transition-transform",
                  "font-semibold"
                )}
              >
                <Gift className="h-4 w-4 mr-2" />
                Create My Wishlist
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>

          {/* Decorative element */}
          <div 
            className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-primary/5 blur-2xl pointer-events-none"
            aria-hidden="true"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GuestWishlistCTA;
