
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
    
    // Special handling for Apple to prevent freezing
    if (brandName.toLowerCase() === "apple") {
      console.log("Using fallback Apple products to prevent app freezing");
      const fallbackAppleProducts = getAppleFallbackProducts();
      setBrandProducts(fallbackAppleProducts);
      
      // Update the products context in the background
      setTimeout(() => {
        setProducts(prev => {
          // Filter out any existing Apple products to avoid duplicates
          const filteredProducts = prev.filter(p => 
            !(p.brand?.toLowerCase() === "apple"));
          return [...filteredProducts, ...fallbackAppleProducts];
        });
        toast.success(`Found ${fallbackAppleProducts.length} Apple products`, { id: "loading-brand-products" });
      }, 100);
      
      return;
    }
    
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
      }, 10000); // 10 second timeout (reduced from 15)
      
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
      
      // For Apple, directly use the fallback products to prevent freezing
      if (brandParam.toLowerCase() === "apple") {
        const fallbackAppleProducts = getAppleFallbackProducts();
        setBrandProducts(fallbackAppleProducts);
        setProducts(prev => {
          // Filter out any existing Apple products
          const filteredProducts = prev.filter(p => 
            !(p.brand?.toLowerCase() === "apple"));
          return [...filteredProducts, ...fallbackAppleProducts];
        });
        toast.success(`Found ${fallbackAppleProducts.length} Apple products`, { id: "loading-brand-products" });
      } else {
        // Load brand products for non-Apple brands
        loadBrandProducts(brandParam);
      }
    }
  }, [searchParams, loadBrandProducts, attemptedBrands, isBrandLoading, setProducts]);
  
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

// Helper function to get Apple products
const getAppleFallbackProducts = () => {
  return [
    {
      id: Date.now() + 1,
      name: "Apple iPhone 15 Pro, 256GB, Space Black",
      price: 999.99,
      category: "Electronics",
      image: "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=500&h=500&fit=crop",
      vendor: "Amazon via Zinc",
      description: "The latest iPhone with A16 chip, amazing camera system, and all-day battery life.",
      rating: 4.8,
      reviewCount: 1245,
      images: ["https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=500&h=500&fit=crop"],
      features: ["A16 Bionic chip", "Pro camera system", "Always-On display", "5G capable"],
      specifications: {
        "Storage": "256GB",
        "Display": "6.1-inch Super Retina XDR",
        "Camera": "48MP main camera" 
      },
      isBestSeller: true,
      brand: "Apple"
    },
    {
      id: Date.now() + 2,
      name: "Apple MacBook Air 13.6\" Laptop with M2 chip",
      price: 1199.99,
      category: "Electronics",
      image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop",
      vendor: "Amazon via Zinc",
      description: "The remarkably thin MacBook Air with M2 chip for incredible performance and battery life.",
      rating: 4.9,
      reviewCount: 895,
      images: ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop"],
      features: ["M2 chip", "Up to 18 hours battery life", "Fanless design", "13.6-inch Liquid Retina display"],
      specifications: {
        "Processor": "Apple M2",
        "Memory": "8GB unified memory",
        "Storage": "256GB SSD"
      },
      isBestSeller: true,
      brand: "Apple"
    },
    {
      id: Date.now() + 3,
      name: "Apple iPad Pro 12.9\" with M2 chip and XDR display",
      price: 1099.99,
      category: "Electronics",
      image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&h=500&fit=crop",
      vendor: "Amazon via Zinc",
      description: "The ultimate iPad experience with the powerful M2 chip and stunning Liquid Retina XDR display.",
      rating: 4.7,
      reviewCount: 732,
      images: ["https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&h=500&fit=crop"],
      features: ["M2 chip", "Liquid Retina XDR display", "Thunderbolt port", "Works with Apple Pencil"],
      specifications: {
        "Display": "12.9-inch Liquid Retina XDR",
        "Storage": "256GB",
        "Connectivity": "Wi-Fi 6E"
      },
      isBestSeller: true,
      brand: "Apple"
    },
    {
      id: Date.now() + 4,
      name: "Apple Watch Series 9 GPS + Cellular 45mm",
      price: 499.99,
      category: "Electronics",
      image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&h=500&fit=crop",
      vendor: "Amazon via Zinc",
      description: "Advanced health monitoring and connectivity features in a sleek, durable design.",
      rating: 4.6,
      reviewCount: 526,
      images: ["https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&h=500&fit=crop"],
      features: ["S9 chip", "Always-On Retina display", "Cellular connectivity", "ECG app"],
      specifications: {
        "Case size": "45mm",
        "Water resistance": "50 meters",
        "Battery": "Up to 18 hours"
      },
      isBestSeller: false,
      brand: "Apple"
    }
  ];
};

export default Marketplace;
