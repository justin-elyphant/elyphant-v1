
import React, { useEffect, useState, useCallback } from "react";
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
  
  // Memoized function to handle brand loading
  const loadBrandProducts = useCallback(async (brandName: string) => {
    console.log(`MarketplaceWrapper: Processing brand parameter: ${brandName}`);
    
    // Set loading state
    setIsBrandLoading(true);
    toast.loading(`Looking for ${brandName} products...`, { id: "loading-brand-products" });
    
    try {
      // Handle special case for Apple to avoid fruit results
      const searchBrandName = brandName.toLowerCase() === "apple" ? 
        "Apple technology" : 
        brandName;
      
      // Fetch products for this brand with a timeout
      const timeout = setTimeout(() => {
        if (isBrandLoading) {
          console.log(`Brand product loading timeout for ${brandName}`);
          setIsBrandLoading(false);
          toast.error(`Loading ${brandName} products took too long. Try again later.`, { id: "loading-brand-products" });
        }
      }, 15000); // 15 second timeout
      
      // Fetch products for this brand
      const brandProductsResult = await handleBrandProducts(searchBrandName, products, setProducts);
      
      // Clear timeout since we got a response
      clearTimeout(timeout);
      
      console.log(`Finished loading products for ${brandName}, found ${brandProductsResult.length} products`);
      setIsBrandLoading(false);
      setBrandProducts(brandProductsResult);
    } catch (error) {
      console.error(`Error in brand products fetch: ${error}`);
      setIsBrandLoading(false);
      toast.error(`Couldn't load ${brandName} products`, { id: "loading-brand-products" });
    }
  }, [products, setProducts, isBrandLoading]);
  
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
    
    // Only process if we have a brand parameter, we're not already loading, and we haven't attempted this brand before
    if (brandParam && !isBrandLoading && !attemptedBrands.includes(brandParam)) {
      // Mark this brand as attempted to prevent duplicate fetches
      setAttemptedBrands(prev => [...prev, brandParam]);
      
      // Load brand products
      loadBrandProducts(brandParam);
    }
  }, [searchParams, loadBrandProducts, attemptedBrands, isBrandLoading]);
  
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
