
import React from "react";
import { Star } from "lucide-react";
import QuickWishlistButton from "./QuickWishlistButton";
import { Product } from "@/types/product";

interface ProductInfoSectionProps {
  product: Product;
  viewMode: "grid" | "list";
  isFavorited: boolean;
  onWishlistClick: (e: React.MouseEvent) => void;
  discountPercent: number | null;
}

const ProductInfoSection: React.FC<ProductInfoSectionProps> = ({
  product,
  viewMode,
  isFavorited,
  onWishlistClick,
  discountPercent
}) => {
  const getTitle = () => product.title || product.name || "";
  const getPrice = () => product.price?.toFixed(2) || "0.00";
  const getRating = () => product.rating || product.stars || 0;
  const getReviewCount = () => product.reviewCount || product.num_reviews || 0;

  return (
    <>
      <div className="flex justify-between items-start">
        <h3 className={`font-medium text-sm line-clamp-2 flex-1 ${viewMode === "grid" ? "min-h-[2.5rem]" : ""}`}>
          {getTitle()}
        </h3>
        {viewMode === "list" && (
          <div className="ml-2">
            <QuickWishlistButton
              productId={product.product_id || product.id || ""}
              isFavorited={isFavorited}
              onClick={onWishlistClick}
              size="sm"
              variant="subtle"
            />
          </div>
        )}
      </div>
      <div className="mt-2 flex items-baseline">
        <span className="font-bold">${getPrice()}</span>
        {discountPercent && (product as any).original_price && (
          <span className="text-sm text-muted-foreground line-through ml-2">
            ${(product as any).original_price.toFixed(2)}
          </span>
        )}
      </div>
      {/* Ratings */}
      {getRating() > 0 && (
        <div className="flex items-center mt-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-3 w-3 ${i < Math.round(getRating()) ? 'text-amber-500 fill-amber-500' : 'text-gray-200'}`}
            />
          ))}
          <span className="text-xs text-muted-foreground ml-1">
            {getReviewCount()}
          </span>
        </div>
      )}
    </>
  );
};

export default ProductInfoSection;

