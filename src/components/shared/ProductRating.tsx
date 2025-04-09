
import React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductRatingProps {
  rating?: number;
  reviewCount?: number | string; // Accept both number and string
  size?: "sm" | "md" | "lg";
  className?: string;
}

const ProductRating: React.FC<ProductRatingProps> = ({ 
  rating = 0, 
  reviewCount, 
  size = "md",
  className = ""
}) => {
  // No reviews, don't display
  if (!rating && !reviewCount) return null;
  
  // Set the star size based on the size prop
  const getStarSize = () => {
    switch (size) {
      case "sm": return "h-3 w-3";
      case "lg": return "h-5 w-5";
      default: return "h-4 w-4";
    }
  };
  
  // Set the text size based on the size prop
  const getTextSize = () => {
    switch (size) {
      case "sm": return "text-xs";
      case "lg": return "text-base";
      default: return "text-sm";
    }
  };
  
  const starSize = getStarSize();
  const textSize = getTextSize();
  
  // Convert reviewCount to string if it's a number
  const reviewCountStr = reviewCount !== undefined ? reviewCount.toString() : undefined;
  
  return (
    <div className={cn("flex items-center", className)}>
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={cn(
              starSize,
              i < Math.floor(rating) 
                ? "fill-yellow-400 text-yellow-400" 
                : "fill-gray-200 text-gray-200"
            )}
          />
        ))}
      </div>
      {reviewCountStr && (
        <span className={`ml-1 text-muted-foreground ${textSize}`}>
          ({reviewCountStr})
        </span>
      )}
    </div>
  );
};

export default ProductRating;
