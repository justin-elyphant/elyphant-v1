import React from "react";
import { Product } from "@/types/product";
import ProductRating from "@/components/shared/ProductRating";

interface ReviewsSectionProps {
  product: Product;
}

const ReviewsSection: React.FC<ReviewsSectionProps> = ({ product }) => {
  const rating = product.stars || product.rating || product.metadata?.stars || 0;
  const reviewCount = product.reviewCount || product.num_reviews || 
                      product.metadata?.review_count || 0;
  
  return (
    <div className="space-y-4 py-3">
      {/* Rating Summary */}
      <div className="flex items-center gap-4 pb-4 border-b">
        <div className="text-center">
          <div className="text-4xl font-bold text-elyphant-black">
            {rating.toFixed(1)}
          </div>
          <div className="flex items-center justify-center mt-2">
            <ProductRating rating={rating} reviewCount={reviewCount} size="lg" />
          </div>
        </div>
      </div>
      
      {/* Reviews Info */}
      <div className="text-sm text-elyphant-grey-text">
        <p>
          Ratings are sourced from verified purchases to help you make informed decisions.
        </p>
      </div>
    </div>
  );
};

export default ReviewsSection;
