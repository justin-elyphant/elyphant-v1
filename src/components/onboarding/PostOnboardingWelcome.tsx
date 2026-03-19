
import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift, List, Search, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { triggerHapticFeedback } from "@/utils/haptics";

interface PostOnboardingWelcomeProps {
  open: boolean;
  userName: string;
  onDismiss: () => void;
}

const actions = [
  {
    id: "find-gift",
    icon: Gift,
    title: "Find a Gift",
    description: "Let Nicole AI help you pick the perfect present",
    route: "/gifts",
  },
  {
    id: "create-wishlist",
    icon: List,
    title: "Create a Wishlist",
    description: "Build and share your wishlist with friends & family",
    route: "/wishlists",
  },
  {
    id: "explore-shop",
    icon: Search,
    title: "Explore the Shop",
    description: "Browse our curated marketplace of top brands",
    route: "/marketplace",
  },
] as const;

const PostOnboardingWelcome: React.FC<PostOnboardingWelcomeProps> = ({
  open,
  userName,
  onDismiss,
}) => {
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = React.useState(false);

  const firstName = userName?.split(" ")[0] || "there";

  const handleAction = (route: string) => {
    triggerHapticFeedback("selection");
    setIsNavigating(true);
    localStorage.setItem("postOnboardingWelcomeSeen", "true");
    setTimeout(() => {
      onDismiss();
      navigate(route);
    }, 200);
  };

  const handleSkip = () => {
    triggerHapticFeedback("light");
    localStorage.setItem("postOnboardingWelcomeSeen", "true");
    onDismiss();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleSkip()}>
      <DialogContent className="sm:max-w-lg md:max-w-xl max-w-[90vw] w-full p-6 pb-safe">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-2 mb-2">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
          >
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
          </motion.div>

          <motion.h2
            className="text-xl md:text-2xl font-semibold text-foreground"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Welcome to Elyphant, {firstName}!
          </motion.h2>

          <motion.p
            className="text-sm md:text-base text-muted-foreground"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Here's what you can do
          </motion.p>
        </div>

        {/* Action cards */}
        <div className="flex flex-col gap-3 mt-2">
          {actions.map((action, index) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.35 + index * 0.1,
                type: "spring",
                stiffness: 300,
                damping: 25,
              }}
              whileTap={{ scale: 0.97 }}
            >
              <Button
                variant="outline"
                className="flex items-center justify-start gap-4 p-4 md:p-5 w-full h-auto text-left border-2 hover:border-primary/30 min-h-[44px] touch-manipulation"
                onClick={() => handleAction(action.route)}
                disabled={isNavigating}
              >
                <action.icon className="w-6 h-6 text-primary flex-shrink-0" />
                <div className="flex flex-col flex-1">
                  <span className="text-base font-semibold text-foreground">
                    {action.title}
                  </span>
                  <span className="text-sm text-muted-foreground font-normal mt-0.5">
                    {action.description}
                  </span>
                </div>
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Skip link */}
        <motion.div
          className="text-center mt-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <button
            type="button"
            onClick={handleSkip}
            className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 min-h-[44px] touch-manipulation transition-colors"
          >
            Just browsing
          </button>
        </motion.div>

        {isNavigating && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
            <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PostOnboardingWelcome;
