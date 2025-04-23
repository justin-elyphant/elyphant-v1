
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import MarketplaceHeader from "./MarketplaceHeader";
import MarketplaceContent from "./MarketplaceContent";
import { useProducts } from "@/contexts/ProductContext";
import ProductDetailsDialog from "./product-details/ProductDetailsDialog";
import { useAuth } from "@/contexts/auth";

const MarketplaceWrapper = () => {
  const [searchParams] = useSearchParams();
  const productId = searchParams.get("productId");
  const { products, isLoading } = useProducts();
  const { user } = useAuth();
  
  const [showProductDetails, setShowProductDetails] = useState<number | null>(
    productId ? parseInt(productId) : null
  );
  
  // Handle URL param changes
  useEffect(() => {
    if (productId) {
      setShowProductDetails(parseInt(productId));
    } else {
      setShowProductDetails(null);
    }
  }, [productId]);
  
  const selectedProduct = showProductDetails !== null 
    ? products.find(p => p.id === showProductDetails)
    : null;
    
  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-gradient-to-b from-purple-50 to-gray-50 pb-8">
        <MarketplaceHeader 
          title="Curated Marketplace" 
          subtitle="Discover unique products perfect for everyone on your list"
        />
      </div>
      
      <div className="container mx-auto px-4">
        <MarketplaceContent 
          products={products}
          isLoading={isLoading}
        />
      </div>
      
      <ProductDetailsDialog 
        product={selectedProduct}
        open={showProductDetails !== null}
        onOpenChange={(open) => {
          if (!open) {
            // Update URL to remove productId
            const newParams = new URLSearchParams(searchParams);
            newParams.delete("productId");
            window.history.replaceState(
              {}, 
              '', 
              `${window.location.pathname}${newParams.toString() ? '?' + newParams.toString() : ''}`
            );
            setShowProductDetails(null);
          }
        }}
        userData={user}
      />
    </div>
  );
};

export default MarketplaceWrapper;
