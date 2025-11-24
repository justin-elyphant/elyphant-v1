import React from "react";
import { Product } from "@/types/product";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReviewsSectionProps {
  product: Product;
}

const ReviewsSection: React.FC<ReviewsSectionProps> = ({ product }) => {
  const rating = product.rating || product.stars || 0;
  const reviewCount = product.reviewCount || product.num_reviews || 0;
  
  return (
    <div className="space-y-4 py-3">
      {/* Rating Summary */}
      <div className="flex items-center gap-4 pb-4 border-b">
        <div className="text-center">
          <div className="text-4xl font-bold text-elyphant-black">
            {rating.toFixed(1)}
          </div>
          <div className="flex items-center justify-center mt-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-4 w-4",
                  i < Math.floor(rating)
                    ? "text-elyphant-black fill-elyphant-black"
                    : "text-gray-300"
                )}
              />
            ))}
          </div>
          <p className="text-sm text-elyphant-grey-text mt-1">
            {reviewCount} reviews
          </p>
        </div>
      </div>
      
      {/* Reviews Info */}
      <div className="text-sm text-elyphant-grey-text">
        <p>
          Product reviews are sourced from verified Amazon purchases. 
          Click through to Amazon to read detailed customer reviews and ratings.
        </p>
      </div>
    </div>
  );
};

export default ReviewsSection;
