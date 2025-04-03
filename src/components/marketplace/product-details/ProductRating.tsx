
import React from "react";
import { Star, StarHalf } from "lucide-react";

interface ProductRatingProps {
  rating?: number;
  reviewCount?: number;
}

const ProductRating = ({ rating, reviewCount }: ProductRatingProps) => {
  if (!rating) return null;
  
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  return (
    <div className="flex items-center gap-1 mt-1">
      <div className="flex text-yellow-500">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
        ))}
        {hasHalfStar && <StarHalf className="h-4 w-4 fill-yellow-500 text-yellow-500" />}
      </div>
      <span className="text-sm text-muted-foreground">
        {rating.toFixed(1)}
        {reviewCount && ` (${reviewCount})`}
      </span>
    </div>
  );
};

export default ProductRating;
