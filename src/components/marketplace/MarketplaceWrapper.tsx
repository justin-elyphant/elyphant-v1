
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import MarketplaceHeader from "./MarketplaceHeader";
import MarketplaceContent from "./MarketplaceContent";
import { useProducts } from "@/contexts/ProductContext";
import ProductDetailsDialog from "./product-details/ProductDetailsDialog";
import { useAuth } from "@/contexts/auth";
import { ProductProvider } from "@/contexts/ProductContext";

const MarketplaceInner = () => {
  const [searchParams] = useSearchParams();
  const productId = searchParams.get("productId");
  const { products } = useProducts();
  const { user } = useAuth(); // Changed from userData to user
  
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
    <div className="min-h-screen bg-gray-50">
      <MarketplaceHeader 
        title="Marketplace" 
        subtitle="Discover unique products for everyone on your list"
      />
      <MarketplaceContent 
        products={products}
        isLoading={false}
      />
      
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

const MarketplaceWrapper = () => {
  return (
    <ProductProvider>
      <MarketplaceInner />
    </ProductProvider>
  );
};

export default MarketplaceWrapper;
