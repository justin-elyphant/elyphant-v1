import React, { useState, useEffect } from "react";
import { X, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { cn } from "@/lib/utils";
import { triggerHapticFeedback } from "@/utils/haptics";

interface GiftCartFloatingBarProps {
  itemCount: number;
  totalPrice: number;
  wishlistOwnerName: string;
  isVisible: boolean;
  onClose: () => void;
}

const GiftCartFloatingBar: React.FC<GiftCartFloatingBarProps> = ({
  itemCount,
  totalPrice,
  wishlistOwnerName,
  isVisible,
  onClose,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);

  // Format price
  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(totalPrice);

  // Show signup prompt after a delay for non-authenticated users
  useEffect(() => {
    if (!user && isVisible) {
      const timer = setTimeout(() => {
        setShowSignupPrompt(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user, isVisible]);

  if (!isVisible || itemCount === 0) {
    return null;
  }

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50",
      "bg-background/95 backdrop-blur-xl border-t border-border shadow-lg",
      "pb-safe", // iOS home indicator safe area
      "animate-in slide-in-from-bottom duration-300"
    )}>
      {/* Signup prompt for guests */}
      {showSignupPrompt && !user && (
        <div className="bg-primary/5 border-b border-primary/10 px-4 py-2">
          <div className="max-w-md mx-auto flex items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Create an account to track your gift delivery
            </p>
            <Link 
              to="/signup?redirect=/cart"
              className="text-sm font-medium text-primary hover:underline"
            >
              Sign Up
            </Link>
          </div>
        </div>
      )}

      {/* Main bar content */}
      <div className="px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">
              {itemCount} item{itemCount !== 1 ? "s" : ""} for {wishlistOwnerName}
            </p>
            <p className="text-sm text-muted-foreground">{formattedPrice}</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="default"
              className="min-h-[44px] touch-manipulation active:scale-95 transition-transform"
              onClick={() => {
                triggerHapticFeedback('light');
                navigate("/cart");
              }}
            >
              View Cart
            </Button>
            <Button
              size="default"
              className="bg-red-600 hover:bg-red-700 text-white min-h-[44px] touch-manipulation active:scale-95 transition-transform"
              onClick={() => {
                triggerHapticFeedback('success');
                navigate("/checkout");
              }}
            >
              Checkout
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 touch-manipulation active:scale-95 transition-transform"
              onClick={() => {
                triggerHapticFeedback('light');
                onClose();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GiftCartFloatingBar;
