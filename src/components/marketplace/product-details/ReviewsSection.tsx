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
      
      {/* Reviews Info with Amazon Link */}
      <div className="text-sm text-elyphant-grey-text space-y-3">
        <p>
          Product reviews are sourced from verified Amazon purchases.
        </p>
        
        {/* Read all reviews on Amazon link */}
        {(product.asin || product.product_id) && (
          <a 
            href={`https://amazon.com/dp/${product.asin || product.product_id}#customerReviews`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
          >
            Read all {reviewCount > 0 ? `${reviewCount.toLocaleString()} ` : ''}reviews on Amazon
            <span className="text-lg leading-none">→</span>
          </a>
        )}
      </div>
    </div>
  );
};

export default ReviewsSection;
