
import React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductRatingProps {
  rating?: number;
  reviewCount?: number | string; // Accept both number and string
  size?: "sm" | "md" | "lg";
  className?: string;
  showParentheses?: boolean;
}

const ProductRating: React.FC<ProductRatingProps> = ({ 
  rating = 0, 
  reviewCount, 
  size = "md",
  className = "",
  showParentheses = false
}) => {
  // Only show rating when we have MEANINGFUL cached data (both rating > 0 AND review count > 0)
  // This ensures non-cached products show clean cards without sloppy placeholder ratings
  const numericReviewCount = typeof reviewCount === 'string' ? parseInt(reviewCount, 10) : reviewCount;
  if (!rating || rating <= 0 || !numericReviewCount || numericReviewCount <= 0) return null;
  
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
  
  // Convert reviewCount to string if it's a valid value
  const reviewCountStr = (reviewCount !== undefined && reviewCount !== null) ? String(reviewCount) : undefined;
  
  // Format review count for display (e.g., 2100 -> 2.1K)
  const formatReviewCount = (count: number | string): string => {
    const numCount = typeof count === 'string' ? parseInt(count, 10) : count;
    if (isNaN(numCount)) return '';
    if (numCount >= 1000) {
      return `${(numCount / 1000).toFixed(1)}K`;
    }
    return numCount.toString();
  };
  
  const formattedReviewCount = reviewCountStr ? formatReviewCount(reviewCountStr) : '';
  
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => {
          // Calculate fill percentage for each star (0-100%)
          const fillPercent = Math.min(100, Math.max(0, (rating - i) * 100));
          
          return (
            <div key={i} className="relative inline-block">
              {/* Background (empty) star */}
              <Star className={cn(starSize, "text-gray-300 fill-gray-300")} />
              
              {/* Foreground (filled) star with partial clip */}
              {fillPercent > 0 && (
                <div 
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${fillPercent}%` }}
                >
                  <Star className={cn(starSize, "text-amber-400 fill-amber-400")} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {formattedReviewCount && (
        <span className={cn("text-muted-foreground", textSize)}>
          {showParentheses ? `(${formattedReviewCount})` : formattedReviewCount}
        </span>
      )}
    </div>
  );
};

export default ProductRating;
