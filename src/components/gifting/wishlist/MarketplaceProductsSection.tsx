import React from "react";
import { Product } from "@/contexts/ProductContext";
import { Sparkles } from "lucide-react";
import QuickAddToWishlist from "./QuickAddToWishlist";
import { Wishlist } from "@/types/profile";

interface MarketplaceProductsSectionProps {
  products: Product[];
  wishlists: Wishlist[];
  onCreateWishlist: () => void;
  isLoading?: boolean;
}

const MarketplaceProductsSection: React.FC<MarketplaceProductsSectionProps> = ({
  products,
  wishlists,
  onCreateWishlist,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="space-y-3 animate-pulse">
              <div className="aspect-square bg-muted rounded-lg" />
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="py-8">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-2xl font-bold">Browse Products</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {products.slice(0, 20).map((product) => (
          <div
            key={product.product_id || product.id}
            className="group bg-card rounded-lg overflow-hidden border border-border hover:border-primary/50 hover:shadow-lg transition-all"
          >
            {/* Product Image */}
            <div className="aspect-square bg-muted overflow-hidden">
              <img
                src={product.image || "/placeholder.svg"}
                alt={product.title || product.name || "Product"}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                loading="lazy"
              />
            </div>

            {/* Product Info */}
            <div className="p-4 space-y-3">
              <div className="space-y-1">
                <h3 className="font-medium text-sm line-clamp-2 leading-tight min-h-[2.5rem]">
                  {product.title || product.name}
                </h3>
                {product.brand && (
                  <p className="text-xs text-muted-foreground">{product.brand}</p>
                )}
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-lg font-bold text-primary">
                  ${product.price?.toFixed(2) || "0.00"}
                </span>
              </div>

              {/* Quick Add Button */}
              <QuickAddToWishlist
                product={product}
                wishlists={wishlists}
                onWishlistCreate={onCreateWishlist}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketplaceProductsSection;
