import React from "react";
import ProductRating from "@/components/shared/ProductRating";
import { formatPrice } from "@/lib/utils";

interface ProductInfoHeaderProps {
  product: any;
}

const ProductInfoHeader = ({ product }: ProductInfoHeaderProps) => {
  return (
    <div>
      <h3 className="text-2xl font-bold">
        {formatPrice(product.price, {
          productSource: product.productSource || (product.isZincApiProduct ? 'zinc_api' : 'manual'),
          skipCentsDetection: product.skipCentsDetection || false
        })}
      </h3>
      <ProductRating rating={product.stars} reviewCount={product.review_count} size="lg" />
      <span className="text-green-600 text-sm block mt-2">Free shipping</span>
    </div>
  );
};

export default ProductInfoHeader;