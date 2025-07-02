
import React, { useState } from "react";
import { Product } from "@/types/product";
import ProductSkeleton from "../ui/ProductSkeleton";
import MobileProductGrid from "./MobileProductGrid";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle } from "lucide-react";

interface MobileMarketplaceLayoutProps {
  products: Product[];
  isLoading: boolean;
  searchTerm: string;
  onProductView: (productId: string) => void;
  error?: string | null;
  onRefresh?: () => void;
}

const MobileMarketplaceLayout: React.FC<MobileMarketplaceLayoutProps> = ({
  products,
  isLoading,
  searchTerm,
  onProductView,
  error,
  onRefresh,
}) => {
  const [viewMode] = useState<"grid" | "list">("grid");

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center max-w-md mx-auto">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          {onRefresh && (
            <Button onClick={onRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Loading state with simplified skeleton
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        {searchTerm && (
          <div className="mb-4">
            <div className="h-8 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
          </div>
        )}
        <ProductSkeleton count={6} viewMode={viewMode} />
      </div>
    );
  }

  // Main content
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Search results header */}
      {searchTerm && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-1">Search Results</h2>
          <p className="text-sm text-muted-foreground">
            {products.length} results for "{searchTerm}"
          </p>
        </div>
      )}

      {/* Mobile Product Grid - matches your screenshot layout */}
      <MobileProductGrid
        products={products}
        onProductClick={onProductView}
        isLoading={isLoading}
        hasMore={false}
        getProductStatus={(product) => {
          if (product.isBestSeller) {
            return { badge: "Best Seller", color: "orange" };
          }
          if (product.vendor === "Amazon via Zinc") {
            return { badge: "Amazon", color: "blue" };
          }
          return null;
        }}
      />
    </div>
  );
};

export default MobileMarketplaceLayout;
