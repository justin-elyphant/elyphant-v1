
import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ShoppingBag, List, Users, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { triggerHapticFeedback } from "@/utils/haptics";
import ElyphantTextLogo from "@/components/ui/ElyphantTextLogo";

interface PostOnboardingWelcomeProps {
  open: boolean;
  userName: string;
  onDismiss: () => void;
}

const actions = [
  {
    id: "explore-shop",
    icon: ShoppingBag,
    title: "Explore the Shop",
    description: "Discover gifts from top brands",
    route: "/marketplace",
  },
  {
    id: "create-wishlist",
    icon: List,
    title: "Create a Wishlist",
    description: "Build and share your perfect list",
    route: "/wishlists",
  },
  {
    id: "find-friends",
    icon: Users,
    title: "Find Friends",
    description: "Connect with friends & family",
    route: "/connections",
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
      <DialogContent className="sm:max-w-md max-w-[90vw] w-full p-8 pb-safe bg-background border-none shadow-xl">
        {/* Branding + Header */}
        <div className="flex flex-col items-center text-center gap-3 mb-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 }}
          >
            <ElyphantTextLogo />
          </motion.div>

          <motion.h2
            className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Welcome to Elyphant
          </motion.h2>

          <motion.p
            className="text-sm text-muted-foreground"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Hey {firstName}, what would you like to do first?
          </motion.p>
        </div>

        {/* Divider */}
        <div className="border-t border-border/40 my-2" />

        {/* Action cards */}
        <div className="flex flex-col gap-2.5 mt-1">
          {actions.map((action, index) => (
            <motion.button
              key={action.id}
              type="button"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.25 + index * 0.08,
                type: "spring",
                stiffness: 300,
                damping: 25,
              }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-4 p-4 w-full text-left rounded-xl border border-border/50 bg-card hover:bg-muted/40 hover:shadow-sm transition-all min-h-[60px] touch-manipulation cursor-pointer group"
              onClick={() => handleAction(action.route)}
              disabled={isNavigating}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 flex-shrink-0">
                <action.icon className="w-5 h-5 text-primary/70" strokeWidth={1.5} />
              </div>
              <div className="flex flex-col flex-1">
                <span className="text-sm font-medium text-foreground">
                  {action.title}
                </span>
                <span className="text-xs text-muted-foreground">
                  {action.description}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors flex-shrink-0" strokeWidth={1.5} />
            </motion.button>
          ))}
        </div>

        {/* Skip link */}
        <motion.div
          className="text-center mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
        >
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs text-muted-foreground hover:text-foreground min-h-[44px] touch-manipulation transition-colors"
          >
            Just browsing
          </button>
        </motion.div>

        {isNavigating && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
            <div className="animate-spin w-5 h-5 border-2 border-foreground border-t-transparent rounded-full" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PostOnboardingWelcome;
