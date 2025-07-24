import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
];

const PopularBrands = () => {
  const [loadingBrand, setLoadingBrand] = useState<string | null>(null);
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Create infinite scroll data by duplicating brands
  const infiniteBrands = [...popularBrands, ...popularBrands, ...popularBrands];

  // Carousel scroll functions with infinite scrolling logic
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const cardWidth = 180 + 16; // card width + gap
      const newScrollLeft = container.scrollLeft - cardWidth;
      
      // If we're at the beginning, jump to the end of the first set
      if (newScrollLeft < 0) {
        container.scrollLeft = popularBrands.length * cardWidth + newScrollLeft;
      } else {
        container.scrollBy({ left: -cardWidth, behavior: 'smooth' });
      }
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const cardWidth = 180 + 16; // card width + gap
      const maxScroll = container.scrollWidth - container.clientWidth;
      const newScrollLeft = container.scrollLeft + cardWidth;
      
      // If we're near the end, jump back to the beginning of the second set
      if (newScrollLeft >= maxScroll - cardWidth) {
        container.scrollLeft = popularBrands.length * cardWidth;
      } else {
        container.scrollBy({ left: cardWidth, behavior: 'smooth' });
      }
    }
  };

  // Initialize scroll position to the middle set for infinite effect
  React.useEffect(() => {
    if (scrollContainerRef.current) {
      const cardWidth = 180 + 16;
      scrollContainerRef.current.scrollLeft = popularBrands.length * cardWidth;
    }
  }, []);
  
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
    <div className="mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Featured Brands</h2>
        <div className="flex gap-2">
          <button
            onClick={scrollLeft}
            className="p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          </button>
          <button
            onClick={scrollRight}
            className="p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      </div>
      
      <div 
        ref={scrollContainerRef}
        className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4 scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {infiniteBrands.map((brand, index) => (
            <Link 
              to={`/marketplace?brandCategories=${encodeURIComponent(brand.name)}`} 
              key={`${brand.id}-${index}`} 
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
    </div>
  );
};

export default PopularBrands;