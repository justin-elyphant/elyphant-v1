
import React, { useEffect, useState } from "react";
import { useMarketplaceSearch } from "@/components/marketplace/hooks/useMarketplaceSearch";
import MarketplaceHeader from "@/components/marketplace/MarketplaceHeader";
import MarketplaceContent from "@/components/marketplace/MarketplaceContent";
import { ProductProvider, useProducts } from "@/contexts/ProductContext";
import { useLocation, useSearchParams } from "react-router-dom";
import { handleBrandProducts } from "@/utils/brandUtils";
import { toast } from "sonner";

const Marketplace = () => {
  return (
    <ProductProvider>
      <MarketplaceWrapper />
    </ProductProvider>
  );
};

const MarketplaceWrapper = () => {
  const { filteredProducts, isLoading, getPageInfo } = useMarketplaceSearch();
  const { pageTitle, subtitle } = getPageInfo();
  const location = useLocation();
  const { products, setProducts } = useProducts();
  const [searchParams] = useSearchParams();
  const [isBrandLoading, setIsBrandLoading] = useState(false);
  const [attemptedBrands, setAttemptedBrands] = useState<string[]>([]);
  const [brandProducts, setBrandProducts] = useState<any[]>([]);
  
  useEffect(() => {
    console.log(`MarketplaceWrapper: Search params: ${location.search}, Products loaded: ${products.length}`);
    
    // Log available products for debugging
    if (products.length > 0) {
      const brandParam = searchParams.get("brand");
      if (brandParam) {
        const matchingProducts = products.filter(p => 
          (p.name && p.name.toLowerCase().includes(brandParam.toLowerCase())) ||
          (p.brand && p.brand.toLowerCase().includes(brandParam.toLowerCase())) ||
          (p.description && p.description.toLowerCase().includes(brandParam.toLowerCase()))
        );
        console.log(`Found ${matchingProducts.length} products matching brand "${brandParam}" in context`);
      }
    }
  }, [location.search, products, searchParams]);

  // Handle brand parameter
  useEffect(() => {
    const brandParam = searchParams.get("brand");
    if (brandParam && !attemptedBrands.includes(brandParam)) {
      console.log(`MarketplaceWrapper: Processing brand parameter: ${brandParam}`);
      
      // Set loading state
      setIsBrandLoading(true);
      toast.loading(`Looking for ${brandParam} products...`, { id: "loading-brand-products" });
      
      // Mark this brand as attempted to prevent duplicate fetches
      setAttemptedBrands(prev => [...prev, brandParam]);
      
      // Handle special case for Apple to avoid fruit results
      const searchBrandName = brandParam.toLowerCase() === "apple" ? 
        "Apple technology" : 
        brandParam;
      
      // Fetch products for this brand
      handleBrandProducts(searchBrandName, products, setProducts)
        .then((brandProducts) => {
          console.log(`Finished loading products for ${brandParam}, found ${brandProducts.length} products`);
          setIsBrandLoading(false);
          setBrandProducts(brandProducts);
          
          if (brandProducts.length === 0) {
            // If no products found, show error toast
            toast.error(`No products found for ${brandParam}`, { id: "loading-brand-products" });
          }
        })
        .catch(error => {
          console.error(`Error in brand products fetch: ${error}`);
          setIsBrandLoading(false);
          toast.error(`Couldn't load ${brandParam} products`, { id: "loading-brand-products" });
        });
    }
  }, [searchParams, products, setProducts, attemptedBrands]);
  
  // Get products to display - if we have brand products, use those, otherwise use filtered products
  const displayProducts = 
    searchParams.get("brand") && brandProducts.length > 0 
      ? brandProducts 
      : filteredProducts;

  return (
    <div className="container mx-auto py-8 px-4">
      <MarketplaceHeader title={pageTitle} subtitle={subtitle} />
      <MarketplaceContent 
        products={displayProducts} 
        isLoading={isLoading || isBrandLoading} 
      />
    </div>
  );
};

export default Marketplace;
