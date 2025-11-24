import React from "react";
import { Star } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { Product } from "@/types/product";

interface ProductPriceAndRatingProps {
  product: Product;
}

const ProductPriceAndRating: React.FC<ProductPriceAndRatingProps> = ({ product }) => {
  const price = product.price || 0;
  const rating = product.rating || product.stars || 0;
  const reviewCount = product.reviewCount || product.num_reviews || 0;
  
  const formatReviewCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };
  
  return (
    <div className="space-y-3">
      {/* Price */}
      <div>
        <span className="text-3xl font-bold text-elyphant-black">
          {formatPrice(price)}
        </span>
      </div>
      
      {/* Rating */}
      {rating > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <Star className="h-4 w-4 text-elyphant-black fill-elyphant-black" />
            <span className="ml-1 text-sm font-semibold text-elyphant-black">
              {rating.toFixed(1)}
            </span>
          </div>
          {reviewCount > 0 && (
            <span className="text-sm text-elyphant-grey-text">
              ({formatReviewCount(reviewCount)} reviews)
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductPriceAndRating;
