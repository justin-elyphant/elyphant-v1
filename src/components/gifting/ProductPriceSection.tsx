
import React from "react";
import { Badge } from "@/components/ui/badge";

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
      ${hasDiscount ? salePrice?.toFixed(2) : price}
      {hasDiscount && (
        <span className="text-xs line-through text-gray-400 ml-1">
          ${Number(price).toFixed(2)}
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
