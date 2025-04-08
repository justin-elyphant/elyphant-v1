
import React, { useEffect, useState, useCallback } from "react";
import { useMarketplaceSearch } from "@/components/marketplace/hooks/useMarketplaceSearch";
import MarketplaceHeader from "@/components/marketplace/MarketplaceHeader";
import MarketplaceContent from "@/components/marketplace/MarketplaceContent";
import { ProductProvider, useProducts } from "@/contexts/ProductContext";
import { useLocation, useSearchParams } from "react-router-dom";
import { handleBrandProducts, getAppleFallbackProducts } from "@/utils/brandUtils";
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
  const location = useLocation();
  const { products, setProducts } = useProducts();
  const [searchParams] = useSearchParams();
  const [isBrandLoading, setIsBrandLoading] = useState(false);
  const [attemptedBrands, setAttemptedBrands] = useState<string[]>([]);
  const [brandProducts, setBrandProducts] = useState<any[]>([]);
  
  // Get custom page title from URL if provided
  const pageTitleParam = searchParams.get("pageTitle");
  const { pageTitle: defaultPageTitle, subtitle: defaultSubtitle } = getPageInfo();
  const pageTitle = pageTitleParam || defaultPageTitle;
  const subtitle = defaultSubtitle;
  
  const loadBrandProducts = useCallback(async (brandName: string) => {
    console.log(`MarketplaceWrapper: Processing brand parameter: ${brandName}`);
    
    if (brandName.toLowerCase() === "apple") {
      console.log("Using fallback Apple products to prevent app freezing");
      const fallbackAppleProducts = getAppleFallbackProducts();
      setBrandProducts(fallbackAppleProducts);
      
      setTimeout(() => {
        setProducts(prev => {
          const filteredProducts = prev.filter(p => 
            !(p.brand?.toLowerCase() === "apple"));
          return [...filteredProducts, ...fallbackAppleProducts];
        });
        toast.success(`Found ${fallbackAppleProducts.length} Apple products`, { id: "loading-brand-products" });
      }, 100);
      
      return;
    }
    
    setIsBrandLoading(true);
    toast.loading(`Looking for ${brandName} products...`, { id: "loading-brand-products" });
    
    try {
      const searchBrandName = brandName.toLowerCase() === "apple" ? 
        "Apple technology" : 
        brandName;
      
      const timeout = setTimeout(() => {
        if (isBrandLoading) {
          console.log(`Brand product loading timeout for ${brandName}`);
          setIsBrandLoading(false);
          toast.error(`Loading ${brandName} products took too long. Try again later.`, { id: "loading-brand-products" });
        }
      }, 10000);
      
      const brandProductsResult = await handleBrandProducts(searchBrandName, products, setProducts);
      
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

  useEffect(() => {
    const brandParam = searchParams.get("brand");
    
    if (brandParam && !isBrandLoading && !attemptedBrands.includes(brandParam)) {
      setAttemptedBrands(prev => [...prev, brandParam]);
      
      if (brandParam.toLowerCase() === "apple") {
        const fallbackAppleProducts = getAppleFallbackProducts();
        setBrandProducts(fallbackAppleProducts);
        setProducts(prev => {
          const filteredProducts = prev.filter(p => 
            !(p.brand?.toLowerCase() === "apple"));
          return [...filteredProducts, ...fallbackAppleProducts];
        });
        toast.success(`Found ${fallbackAppleProducts.length} Apple products`, { id: "loading-brand-products" });
      } else {
        loadBrandProducts(brandParam);
      }
    }
  }, [searchParams, loadBrandProducts, attemptedBrands, isBrandLoading, setProducts]);
  
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
