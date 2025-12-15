
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
  const numericReviewCount = typeof reviewCount === 'string' ? parseInt(reviewCount, 10) : reviewCount;
  const hasValidRating = rating && rating > 0;
  const hasValidReviewCount = numericReviewCount && numericReviewCount > 0;
  
  // Show nothing if we have no meaningful data at all
  if (!hasValidRating && !hasValidReviewCount) return null;
  
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
  
  // Format review count for display (e.g., 2100 -> 2.1K)
  const formatReviewCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };
  
  const formattedReviewCount = hasValidReviewCount ? formatReviewCount(numericReviewCount) : '';
  
  // If we only have review count (no stars), show just the review count text
  if (!hasValidRating && hasValidReviewCount) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <span className={cn("text-muted-foreground", textSize)}>
          {formattedReviewCount} reviews
        </span>
      </div>
    );
  }
  
  // Show full stars + review count when rating is available
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => {
          const fillPercent = Math.min(100, Math.max(0, (rating - i) * 100));
          
          return (
            <div key={i} className="relative inline-block">
              <Star className={cn(starSize, "text-gray-300 fill-gray-300")} />
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
