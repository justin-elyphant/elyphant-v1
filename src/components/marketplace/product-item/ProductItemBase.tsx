import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import ProductImageSection from "./ProductImageSection";
import ProductInfoSection from "./ProductInfoSection";
import { Product } from "@/types/product";
import AddToCartButton from "@/components/marketplace/components/AddToCartButton";
import BuyNowButton from "@/components/marketplace/product-details/BuyNowButton";

interface ProductItemBaseProps {
  product: Product;
  viewMode: "grid" | "list";
  onProductClick: (productId: string) => void;
  onWishlistClick: (e: React.MouseEvent) => void;
  isFavorited: boolean;
  statusBadge?: { badge: string; color: string } | null;
  discountPercent: number | null;
}

const ProductItemBase: React.FC<ProductItemBaseProps> = ({
  product,
  viewMode,
  onProductClick,
  onWishlistClick,
  isFavorited,
  statusBadge,
  discountPercent
}) => {
  const handleClick = () => {
    onProductClick(product.product_id || product.id || "");
  };

  // Prevent click bubbling when clicking an action button
  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  // Button Rendering
  const renderActions = () => (
    <div className="mt-3 flex gap-2">
      {/* Removed onClick from AddToCartButton */}
      <AddToCartButton product={product} variant="outline" size="sm" />
      <BuyNowButton
        productId={Number(product.product_id || product.id) || 0}
        productName={product.title || product.name}
        price={typeof product.price === "number" ? product.price : 0}
        productImage={product.image}
        className="w-auto"
        // Removed the onClick prop here to fix build error
      />
    </div>
  );

  if (viewMode === "list") {
    return (
      <Card className="overflow-hidden cursor-pointer border hover:border-primary/50 transition-all duration-200" onClick={handleClick}>
        <div className="flex flex-col xs:flex-row">
          <ProductImageSection
            product={product}
            viewMode="list"
            statusBadge={statusBadge}
            discountPercent={discountPercent}
            isFavorited={isFavorited}
            onWishlistClick={onWishlistClick}
          />
          <CardContent className="flex-1 p-3">
            <ProductInfoSection
              product={product}
              viewMode="list"
              isFavorited={isFavorited}
              onWishlistClick={onWishlistClick}
              discountPercent={discountPercent}
            />
            {renderActions()}
          </CardContent>
        </div>
      </Card>
    );
  }

  // grid/default
  return (
    <Card className="overflow-hidden cursor-pointer border hover:border-primary/50 transition-all duration-200" onClick={handleClick}>
      <div className="relative">
        <ProductImageSection
          product={product}
          viewMode="grid"
          statusBadge={statusBadge}
          discountPercent={discountPercent}
          isFavorited={isFavorited}
          onWishlistClick={onWishlistClick}
        />
      </div>
      <CardContent className="p-3">
        <ProductInfoSection
          product={product}
          viewMode="grid"
          isFavorited={isFavorited}
          onWishlistClick={onWishlistClick}
          discountPercent={discountPercent}
        />
        {renderActions()}
      </CardContent>
    </Card>
  );
};

export default ProductItemBase;
