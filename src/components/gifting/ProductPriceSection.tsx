
import React from "react";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

interface ProductPriceSectionProps {
  price: number | string;
  salePrice?: number;
  hasDiscount: boolean;
}

const ProductPriceSection: React.FC<ProductPriceSectionProps> = ({
  price,
  salePrice,
  hasDiscount
}) => (
  <div className="mt-2 flex items-center">
    <div className="font-bold text-base">
      {hasDiscount ? formatPrice(salePrice || 0) : formatPrice(Number(price))}
      {hasDiscount && (
        <span className="text-xs line-through text-gray-400 ml-1">
          {formatPrice(Number(price))}
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

export default ProductPriceSection;
