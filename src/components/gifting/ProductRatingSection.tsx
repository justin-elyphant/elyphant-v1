
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
  return (
    <div className="flex items-center mt-1 text-xs text-amber-500">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3 w-3",
            i < Math.round(rating) ? "fill-amber-500 text-amber-500" : "text-gray-300"
          )}
        />
      ))}
      <span className="text-gray-500 ml-1">
        {reviewCount}
      </span>
    </div>
  );
};

export default ProductRatingSection;
