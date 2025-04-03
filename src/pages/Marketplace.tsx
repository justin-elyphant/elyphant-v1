
import React, { useEffect, useState } from "react";
import { useMarketplaceSearch } from "@/components/marketplace/hooks/useMarketplaceSearch";
import MarketplaceHeader from "@/components/marketplace/MarketplaceHeader";
import MarketplaceContent from "@/components/marketplace/MarketplaceContent";
import { ProductProvider, useProducts } from "@/contexts/ProductContext";
import { useLocation, useSearchParams } from "react-router-dom";
import { handleBrandProducts } from "@/utils/brandUtils";

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
  
  useEffect(() => {
    console.log(`MarketplaceWrapper: Search params: ${location.search}, Products loaded: ${products.length}`);
  }, [location.search, products]);

  // Handle brand parameter
  useEffect(() => {
    const brandParam = searchParams.get("brand");
    if (brandParam && products.length > 0) {
      console.log(`MarketplaceWrapper: Processing brand parameter: ${brandParam}`);
      
      // Check if we already have products for this brand
      const brandProducts = products.filter(p => 
        p.vendor === "Amazon via Zinc" && 
        (p.name.toLowerCase().includes(brandParam.toLowerCase()) || 
         (p.description && p.description.toLowerCase().includes(brandParam.toLowerCase())))
      );
      
      if (brandProducts.length === 0 && !isBrandLoading) {
        console.log(`No products found for brand ${brandParam}, fetching from Zinc API`);
        // Start loading
        setIsBrandLoading(true);
        
        // Fetch products for this brand
        handleBrandProducts(brandParam, products, setProducts)
          .then(() => {
            console.log(`Finished loading products for ${brandParam}`);
            setIsBrandLoading(false);
          })
          .catch(error => {
            console.error(`Error in brand products fetch: ${error}`);
            setIsBrandLoading(false);
          });
      } else {
        console.log(`Found ${brandProducts.length} existing products for brand ${brandParam}`);
      }
    }
  }, [searchParams, products, setProducts, isBrandLoading]);

  return (
    <div className="container mx-auto py-8 px-4">
      <MarketplaceHeader title={pageTitle} subtitle={subtitle} />
      <MarketplaceContent 
        products={filteredProducts} 
        isLoading={isLoading || isBrandLoading} 
      />
    </div>
  );
};

export default Marketplace;
