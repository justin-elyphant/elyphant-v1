import React from "react";
import { formatPrice } from "@/lib/utils";
import { Product } from "@/types/product";
import ProductRating from "@/components/shared/ProductRating";

interface ProductPriceAndRatingProps {
  product: Product;
  variantPrice?: number; // Override price for selected variant
}

const ProductPriceAndRating: React.FC<ProductPriceAndRatingProps> = ({ product, variantPrice }) => {
  // Priority: variant price > current_price from offers API > product.price
  const price = variantPrice || product.metadata?.current_price || product.price || 0;
  const rating = product.stars || product.rating || product.metadata?.stars || 0;
  const reviewCount = product.reviewCount || product.num_reviews || 
                      product.metadata?.review_count || 0;
  
  return (
    <div className="space-y-3">
      {/* Price */}
      <div>
        <span className="text-3xl font-bold text-elyphant-black">
          {formatPrice(price)}
        </span>
      </div>
      
      {/* Rating */}
      {(rating > 0 || reviewCount > 0) && (
        <ProductRating rating={rating} reviewCount={reviewCount} size="md" />
      )}
    </div>
  );
};

export default ProductPriceAndRating;
