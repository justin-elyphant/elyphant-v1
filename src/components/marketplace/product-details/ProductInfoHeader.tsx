import React from "react";
import ProductRating from "@/components/shared/ProductRating";
import { formatPrice } from "@/lib/utils";

interface ProductInfoHeaderProps {
  product: any;
  variantPrice?: number | null;
}

const ProductInfoHeader = ({ product, variantPrice }: ProductInfoHeaderProps) => {
  // Handle both field naming conventions for compatibility
  const rating = product.stars || product.rating || product.metadata?.stars || 0;
  const reviewCount = product.reviewCount || product.num_reviews || 
                      product.metadata?.review_count || 0;
  
  // Use variant price if available, otherwise fall back to product price
  const displayPrice = variantPrice || product.price;
  
  return (
    <div>
      <h3 className="text-2xl font-bold">
        {formatPrice(displayPrice, {
          productSource: product.productSource || (product.isZincApiProduct ? 'zinc_api' : 'manual'),
          skipCentsDetection: product.skipCentsDetection || false
        })}
      </h3>
      <ProductRating rating={rating} reviewCount={reviewCount} size="lg" />
    </div>
  );
};

export default ProductInfoHeader;