import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

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
    name: "Yeti", 
    logoUrl: "/images/brands/yeti-logo.svg", 
    productCount: 152 
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
    id: 7, 
    name: "Made In", 
    logoUrl: "/lovable-uploads/baaeaa58-7b69-413d-b176-6689d5eec58b.png", 
    productCount: 87 
  },
  { 
    id: 8, 
    name: "Lego", 
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/LEGO_logo.svg/2048px-LEGO_logo.svg.png", 
    productCount: 76 
  },
  { 
    id: 9, 
    name: "PlayStation", 
    logoUrl: "/images/brands/playstation-logo.png", 
    productCount: 98 
  }
];

const PopularBrands = () => {
  const [loadingBrand, setLoadingBrand] = useState<string | null>(null);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const handleBrandClick = async (e: React.MouseEvent, brandName: string) => {
    e.preventDefault(); // Prevent default navigation
    console.log(`PopularBrands: Brand clicked: ${brandName}`);
    
    // Set loading state for this specific brand
    setLoadingBrand(brandName);
    
    try {
      // Navigate to marketplace with brand search using brandCategories
      const searchUrl = `/marketplace?brandCategories=${encodeURIComponent(brandName)}`;
      navigate(searchUrl, { 
        state: { 
          fromBrand: true, 
          brandName 
        } 
      });
      
    } catch (error) {
      console.error(`Error handling brand click for ${brandName}:`, error);
      toast.error(`Failed to load ${brandName} products`);
    } finally {
      // Clear loading state after a delay
      setTimeout(() => {
        setLoadingBrand(null);
      }, 1000);
    }
  };

  return (
    <div className="mb-8">{/* Grid layout instead of carousel */}
      <div className="text-center mb-space-loose md:mb-space-xl">
        <h2 className="text-heading-2 md:text-heading-1 text-foreground mb-space-tight md:mb-space-standard">
          Featured Brands
        </h2>
        <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Discover trusted brands our customers love - quality guaranteed
        </p>
      </div>
      
      {/* Grid layout for mobile-first approach */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-8 gap-3 md:gap-4">
        {popularBrands.map((brand) => (
          <Link 
            to={`/marketplace?brandCategories=${encodeURIComponent(brand.name)}`} 
            key={brand.id}
            onClick={(e) => handleBrandClick(e, brand.name)}
            className={cn(
              loadingBrand === brand.name ? "pointer-events-none opacity-70" : "",
              "block"
            )}
          >
            <Card className={cn(
              "hover:shadow-md transition-shadow touch-target-48 touch-manipulation",
              isMobile ? "min-h-[140px]" : "min-h-[120px]"
            )}>
              <CardContent className={cn(
                "flex flex-col items-center justify-center",
                isMobile ? "p-4" : "p-3 md:p-4 lg:p-6"
              )}>
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3 md:mb-4 overflow-hidden p-2">
                  <img 
                    src={brand.logoUrl} 
                    alt={brand.name} 
                    className="max-w-full max-h-full object-contain opacity-80 hover:opacity-100 transition-opacity"
                    loading="lazy"
                    onError={(e) => {
                      // Fallback in case image fails to load
                      (e.target as HTMLImageElement).src = "/placeholder.svg";
                      console.log(`Brand image fallback used for: ${brand.name}`);
                    }}
                  />
                </div>
                <h3 className={cn(
                  "font-medium text-center leading-tight",
                  isMobile ? "text-sm" : "text-xs md:text-sm"
                )}>
                  {brand.name}
                </h3>
                <p className={cn(
                  "text-gray-500 text-center",
                  isMobile ? "text-xs mt-1" : "text-xs mt-1"
                )}>
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
      
      {/* Shop All Brands Button */}
      <div className="flex justify-center mt-space-loose md:mt-space-xl">
        <Link
          to="/marketplace"
          className="inline-flex"
        >
          <Button
            variant="outline" 
            size="touch"
            className="touch-target-44 transition-all duration-200"
          >
            View All Brands
            <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5 group-hover:translate-x-1 transition-transform duration-200" />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default PopularBrands;