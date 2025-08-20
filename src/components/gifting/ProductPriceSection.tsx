
import React from "react";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

interface ProductPriceSectionProps {
  price: number | string;
  salePrice?: number;
  hasDiscount: boolean;
  productSource?: 'zinc_api' | 'shopify' | 'vendor_portal' | 'manual';
  skipCentsDetection?: boolean;
}

const ProductPriceSection: React.FC<ProductPriceSectionProps> = ({
  price,
  salePrice,
  hasDiscount,
  productSource,
  skipCentsDetection
}) => {
  const priceOptions = { productSource, skipCentsDetection };
  
  return (
    <div className="mt-2 flex items-center">
      <div className="font-bold text-base">
        {hasDiscount ? formatPrice(salePrice || 0, priceOptions) : formatPrice(Number(price), priceOptions)}
        {hasDiscount && (
          <span className="text-xs line-through text-gray-400 ml-1">
            {formatPrice(Number(price), priceOptions)}
          </span>
        )}
      </div>
      {hasDiscount && (
        <Badge className="ml-2 bg-red-500 text-white text-xs">
          Sale
        </Badge>
      )}
    </div>
  );
};

export default ProductPriceSection;
