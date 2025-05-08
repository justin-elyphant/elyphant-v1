
import React from "react";
import ProductGridOptimized from "./ProductGridOptimized";
import { Spinner } from "@/components/ui/spinner";
import { CircleSlash, Search } from "lucide-react";

interface MarketplaceContentProps {
  products: any[];
  isLoading: boolean;
  searchTerm: string;
}

const MarketplaceContent = ({ 
  products, 
  isLoading, 
  searchTerm 
}: MarketplaceContentProps) => {
  // Function to render the appropriate content based on loading state and products
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <Spinner />
          <p className="text-lg font-medium mt-4">Loading products...</p>
          <p className="text-sm text-muted-foreground">Please wait while we find the best gifts for you</p>
        </div>
      );
    }

    if (!products || products.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="bg-gray-100 p-4 rounded-full">
            <CircleSlash className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium mt-4">No products found</h3>
          <p className="text-sm text-muted-foreground max-w-md text-center mt-2">
            {searchTerm 
              ? `We couldn't find any products matching "${searchTerm}". Try a different search term.`
              : "No products are available at the moment. Please check back later."}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {searchTerm 
              ? `Showing ${products.length} results for "${searchTerm}"` 
              : `Showing ${products.length} products`}
          </p>
        </div>
        
        <ProductGridOptimized 
          products={products} 
          viewMode="grid" 
          isLoading={isLoading}
        />
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      {renderContent()}
    </div>
  );
};

export default MarketplaceContent;
