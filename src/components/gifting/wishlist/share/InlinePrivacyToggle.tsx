import React from "react";
import { Globe, Lock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { triggerHapticFeedback } from "@/utils/haptics";

interface InlinePrivacyToggleProps {
  isPublic: boolean;
  onToggle: () => void;
  disabled?: boolean;
  isUpdating?: boolean;
  size?: "sm" | "md";
  className?: string;
}

const InlinePrivacyToggle = ({
  isPublic,
  onToggle,
  disabled = false,
  isUpdating = false,
  size = "md",
  className
}: InlinePrivacyToggleProps) => {
  const handleToggle = async () => {
    if (disabled || isUpdating) return;
    
    await triggerHapticFeedback('selection');
    onToggle();
  };

  const sizeClasses = {
    sm: "h-7 px-2.5 text-xs gap-1.5",
    md: "h-9 px-3 text-sm gap-2"
  };

  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <button
      onClick={handleToggle}
      disabled={disabled || isUpdating}
      className={cn(
        "inline-flex items-center rounded-full font-medium transition-all duration-200",
        "min-h-[38px] min-w-[38px] touch-manipulation",
        "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2",
        "active:scale-95",
        sizeClasses[size],
        isPublic 
          ? "bg-muted text-foreground hover:bg-muted/80 border border-border" 
          : "bg-muted text-muted-foreground hover:bg-muted/80",
        (disabled || isUpdating) && "opacity-50 cursor-not-allowed",
        className
      )}
      aria-label={isPublic ? "Wishlist is public. Tap to make private." : "Wishlist is private. Tap to make public."}
    >
      {isUpdating ? (
        <Loader2 className={cn(iconSize, "animate-spin")} />
      ) : isPublic ? (
        <Globe className={iconSize} />
      ) : (
        <Lock className={iconSize} />
      )}
      <span>{isPublic ? "Public" : "Private"}</span>
    </button>
  );
};

export default InlinePrivacyToggle;
