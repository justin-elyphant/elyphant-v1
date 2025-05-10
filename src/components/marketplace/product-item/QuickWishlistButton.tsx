
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
  variant?: "default" | "subtle" | "outline" | "floating";
}

const QuickWishlistButton = ({
  productId,
  isFavorited,
  onClick,
  size = "md",
  variant = "default",
}: QuickWishlistButtonProps) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  
  // Define sizes for different button variants
  const sizeClasses = {
    sm: "h-7 w-7",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };
  
  // Define style variants
  const variantClasses = {
    default: isFavorited 
      ? "bg-primary hover:bg-primary/90 text-primary-foreground rounded-full" 
      : "bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 shadow-sm rounded-full",
    subtle: isFavorited 
      ? "bg-primary/10 hover:bg-primary/20 text-primary rounded-full" 
      : "bg-gray-100/80 hover:bg-gray-200/80 text-gray-700 rounded-full",
    outline: isFavorited 
      ? "border-primary bg-transparent hover:bg-primary/10 text-primary rounded-full"
      : "border border-gray-200 bg-transparent hover:bg-gray-100/80 text-gray-700 rounded-full",
    floating: isFavorited
      ? "bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-md"
      : "bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 shadow-md rounded-full",
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
              isPressed ? "scale-90" : "hover:scale-105",
              "touch-manipulation" // Improves touch events on mobile
            )}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => {
              setIsHovering(false);
              setIsPressed(false);
            }}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            onTouchStart={() => setIsPressed(true)}
            onTouchEnd={() => setIsPressed(false)}
            onClick={(e) => {
              onClick(e);
              // Add a little animation effect
              setIsPressed(true);
              setTimeout(() => setIsPressed(false), 200);
            }}
            aria-label={isFavorited ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart
              className={cn(
                "transition-all duration-200",
                isFavorited ? "fill-current" : (isHovering || isPressed ? "fill-current/20" : ""),
                size === "sm" ? "h-3.5 w-3.5" : size === "md" ? "h-4 w-4" : "h-5 w-5"
              )}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent 
          side="bottom"
          className="text-xs py-1 px-2"
        >
          {isFavorited ? "Remove from wishlist" : "Add to wishlist"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default QuickWishlistButton;
