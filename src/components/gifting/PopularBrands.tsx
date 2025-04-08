
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProducts } from "@/contexts/ProductContext";
import { handleBrandProducts } from "@/utils/brandUtils";
import { toast } from "sonner";

// Mock data for popular brands with real logos
const popularBrands = [
  { 
    id: 1, 
    name: "Nike", 
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_NIKE.svg/1200px-Logo_NIKE.svg.png", 
    productCount: 245 
  },
  { 
    id: 2, 
    name: "Apple", 
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg", 
    productCount: 189 
  },
  { 
    id: 3, 
    name: "Samsung", 
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Samsung_Logo.svg/2560px-Samsung_Logo.svg.png", 
    productCount: 167 
  },
  { 
    id: 4, 
    name: "Sony", 
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Sony_logo.svg/2560px-Sony_logo.svg.png", 
    productCount: 142 
  },
  { 
    id: 5, 
    name: "Adidas", 
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Adidas_Logo.svg/2560px-Adidas_Logo.svg.png", 
    productCount: 134 
  },
  { 
    id: 6, 
    name: "Lululemon", 
    logoUrl: "/lovable-uploads/f0a52aa3-9dcd-4367-9a66-0724e97f2641.png", 
    productCount: 98 
  },
  { 
    id: 7, 
    name: "Canon", 
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Canon_logo.svg/2560px-Canon_logo.svg.png", 
    productCount: 87 
  },
  { 
    id: 8, 
    name: "Lego", 
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/LEGO_logo.svg/2048px-LEGO_logo.svg.png", 
    productCount: 76 
  },
];

const PopularBrands = () => {
  const { products, setProducts } = useProducts();
  const [loadingBrand, setLoadingBrand] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const handleBrandClick = async (e: React.MouseEvent, brandName: string) => {
    e.preventDefault(); // Prevent default navigation
    console.log(`PopularBrands: Brand clicked: ${brandName}, products available: ${products.length}`);
    
    // Set loading state for this specific brand
    setLoadingBrand(brandName);
    
    // Create a page title for the brand
    const pageTitle = `${brandName} Products`;
    
    try {
      // For Apple, navigate immediately to prevent freezing
      if (brandName.toLowerCase() === "apple") {
        console.log("Apple detected, navigating immediately");
        navigate(`/marketplace?brand=${encodeURIComponent(brandName)}&pageTitle=${encodeURIComponent(pageTitle)}`);
        return;
      }
      
      // Set a timeout to prevent hanging
      const timeoutId = setTimeout(() => {
        if (loadingBrand === brandName) {
          console.log(`Brand loading timeout for ${brandName}`);
          setLoadingBrand(null);
          toast.error(`Loading ${brandName} products took too long`, { id: "loading-brand-products" });
          // Navigate anyway after timeout
          navigate(`/marketplace?brand=${encodeURIComponent(brandName)}&pageTitle=${encodeURIComponent(pageTitle)}`);
        }
      }, 3000); // 3 second timeout
      
      // Fetch brand products from Zinc API
      await handleBrandProducts(brandName, products, setProducts);
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      // Navigate to the marketplace
      navigate(`/marketplace?brand=${encodeURIComponent(brandName)}&pageTitle=${encodeURIComponent(pageTitle)}`);
    } catch (error) {
      console.error(`Error loading ${brandName} products:`, error);
      toast.error(`Failed to load ${brandName} products`);
      // Navigate anyway even if there was an error
      navigate(`/marketplace?brand=${encodeURIComponent(brandName)}&pageTitle=${encodeURIComponent(pageTitle)}`);
    } finally {
      // Clear loading state
      setLoadingBrand(null);
    }
  };

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-6">Featured Brands</h2>
      
      <ScrollArea className="w-full whitespace-nowrap pb-4">
        <div className="flex space-x-4">
          {popularBrands.map((brand) => (
            <Link 
              to={`/marketplace?brand=${encodeURIComponent(brand.name)}`} 
              key={brand.id} 
              onClick={(e) => handleBrandClick(e, brand.name)}
              className={loadingBrand === brand.name ? "pointer-events-none opacity-70" : ""}
            >
              <Card className="min-w-[180px] hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 overflow-hidden p-2">
                    <img 
                      src={brand.logoUrl} 
                      alt={brand.name} 
                      className="max-w-full max-h-full object-contain"
                      loading="lazy"
                      onError={(e) => {
                        // Fallback in case image fails to load
                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                        console.log(`Brand image fallback used for: ${brand.name}`);
                      }}
                    />
                  </div>
                  <h3 className="font-medium text-center">{brand.name}</h3>
                  <p className="text-sm text-gray-500 text-center">
                    {brand.productCount} Products
                  </p>
                  {loadingBrand === brand.name && (
                    <div className="mt-2 text-xs text-blue-500">Loading...</div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default PopularBrands;
