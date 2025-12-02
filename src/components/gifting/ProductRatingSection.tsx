
import React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductRatingSectionProps {
  rating: number;
  reviewCount: number;
  isMobile: boolean;
}

const ProductRatingSection: React.FC<ProductRatingSectionProps> = ({
  rating,
  reviewCount,
  isMobile,
}) => {
  if (rating <= 0) return null;
  
  // Format review count (e.g., 2100 -> 2.1K)
  const formatReviewCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };
  
  return (
    <div className="flex items-center mt-1 text-xs">
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, i) => {
          // Calculate fill percentage for each star
          const fillPercent = Math.min(100, Math.max(0, (rating - i) * 100));
          
          return (
            <div key={i} className="relative inline-block">
              {/* Background (empty) star */}
              <Star className="h-3 w-3 text-gray-300 fill-gray-300" />
              
              {/* Foreground (filled) star with partial clip */}
              {fillPercent > 0 && (
                <div 
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${fillPercent}%` }}
                >
                  <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <span className="text-muted-foreground ml-1">
        ({formatReviewCount(reviewCount)})
      </span>
    </div>
  );
};

export default ProductRatingSection;
