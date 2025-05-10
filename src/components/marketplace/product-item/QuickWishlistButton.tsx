
import React, { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface QuickWishlistButtonProps {
  productId: string;
  isFavorited: boolean;
  onClick: (e: React.MouseEvent) => void;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "subtle" | "outline";
}

const QuickWishlistButton = ({
  productId,
  isFavorited,
  onClick,
  size = "md",
  variant = "default",
}: QuickWishlistButtonProps) => {
  const [isHovering, setIsHovering] = useState(false);
  
  // Define sizes for different button variants
  const sizeClasses = {
    sm: "h-7 w-7 rounded-full",
    md: "h-8 w-8 rounded-full",
    lg: "h-10 w-10 rounded-full",
  };
  
  // Define style variants
  const variantClasses = {
    default: isFavorited 
      ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
      : "bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 shadow-sm",
    subtle: isFavorited 
      ? "bg-primary/10 hover:bg-primary/20 text-primary" 
      : "bg-gray-100/80 hover:bg-gray-200/80 text-gray-700",
    outline: isFavorited 
      ? "border-primary bg-transparent hover:bg-primary/10 text-primary"
      : "border border-gray-200 bg-transparent hover:bg-gray-100/80 text-gray-700",
  };
  
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Button
            type="button"
            className={cn(
              "p-0 flex items-center justify-center transition-all",
              sizeClasses[size],
              variantClasses[variant],
              "hover:scale-105 active:scale-95"
            )}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onClick={onClick}
            aria-label={isFavorited ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart
              className={cn(
                "transition-all duration-300",
                isFavorited ? "fill-current" : (isHovering ? "fill-current/20" : ""),
                size === "sm" ? "h-3.5 w-3.5" : size === "md" ? "h-4 w-4" : "h-5 w-5"
              )}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {isFavorited ? "Remove from wishlist" : "Add to wishlist"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default QuickWishlistButton;
