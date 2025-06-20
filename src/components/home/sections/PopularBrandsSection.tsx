
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProducts } from "@/contexts/ProductContext";
import { handleBrandProducts } from "@/utils/brandUtils";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

const PopularBrandsSection = () => {
  const navigate = useNavigate();
  const { products, setProducts } = useProducts();
  const [loadingBrand, setLoadingBrand] = useState<string | null>(null);
  const isMobile = useIsMobile();
  
  const brands = [
    {
      name: "Nike",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_NIKE.svg/1200px-Logo_NIKE.svg.png",
    },
    {
      name: "Lululemon",
      logo: "/lovable-uploads/f0a52aa3-9dcd-4367-9a66-0724e97f2641.png",
    },
    {
      name: "Apple",
      logo: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
    },
    {
      name: "Made In",
      logo: "/lovable-uploads/c8d47b72-d4ff-4269-81b0-e53a01164c71.png",
    },
    {
      name: "Stanley",
      logo: "/lovable-uploads/7e6e1250-c215-402c-836b-e31420624764.png",
    },
    {
      name: "Lego",
      logo: "https://upload.wikimedia.org/wikipedia/commons/2/24/LEGO_logo.svg",
    },
  ];

  // Cleanup loading state when component unmounts or brand changes
  useEffect(() => {
    return () => {
      if (loadingBrand) {
        setLoadingBrand(null);
        toast.dismiss();
      }
    };
  }, [loadingBrand]);

  const handleBrandClick = async (brandName: string) => {
    // Prevent multiple clicks and ensure clean state
    if (loadingBrand) {
      console.log('Another brand is loading, ignoring click');
      return;
    }
    
    console.log(`Loading brand: ${brandName}`);
    setLoadingBrand(brandName);
    
    const loadingToastId = `brand-loading-${brandName}-${Date.now()}`;
    const enhancedSearchTerm = `best selling ${brandName} products`;
    
    // Set up timeout for cleanup
    const timeoutId = setTimeout(() => {
      console.log(`Timeout reached for ${brandName}, cleaning up`);
      setLoadingBrand(null);
      toast.dismiss(loadingToastId);
      toast.error(`Loading ${brandName} products took too long`, { 
        id: `error-${brandName}-${Date.now()}` 
      });
      navigate(`/marketplace?search=${encodeURIComponent(enhancedSearchTerm)}`);
    }, 5000); // 5 second timeout
    
    try {
      // Show loading toast
      toast.loading(`Loading ${brandName} products...`, { 
        id: loadingToastId,
        duration: Infinity // Keep toast until manually dismissed
      });
      
      await handleBrandProducts(brandName, products, setProducts);
      
      // Clear timeout and loading state immediately on success
      clearTimeout(timeoutId);
      setLoadingBrand(null);
      
      // Clear loading toast and show success
      toast.dismiss(loadingToastId);
      toast.success(`${brandName} products loaded successfully`, {
        id: `success-${brandName}-${Date.now()}`,
        duration: 2000
      });
      
      // Navigate to marketplace
      navigate(`/marketplace?search=${encodeURIComponent(enhancedSearchTerm)}`);
      
    } catch (err) {
      console.error(`Error loading ${brandName} products:`, err);
      
      // Clear timeout and loading state on error
      clearTimeout(timeoutId);  
      setLoadingBrand(null);
      
      // Clear loading toast and show error
      toast.dismiss(loadingToastId);
      toast.error(`Failed to load ${brandName} products`, {
        id: `error-${brandName}-${Date.now()}`,
        duration: 3000
      });
      
      // Still navigate to allow user to see available products
      navigate(`/marketplace?search=${encodeURIComponent(enhancedSearchTerm)}`);
    }
  };

  return (
    <div className="py-12 md:py-16 bg-white intersection-target">
      <div className="container px-4 md:px-6">
        <h2 className="text-2xl md:text-3xl font-bold mb-2 md:mb-3 text-center">Popular Brands</h2>
        <p className="text-center text-muted-foreground mb-8 md:mb-12 max-w-2xl mx-auto leading-relaxed">
          Shop from trusted brands our customers love
        </p>
        
        <div className="relative">
          <Carousel
            opts={{
              align: "start",
              loop: false,
            }}
            className="w-full swipe-container will-change-scroll"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {brands.map((brand) => (
                <CarouselItem key={brand.name} className="pl-2 md:pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/6 swipe-item">
                  <div
                    className={cn(
                      "relative flex flex-col items-center justify-center p-3 md:p-4 lg:p-6 rounded-xl bg-white border border-gray-100 hover:shadow-md hover:bg-purple-50 transition cursor-pointer touch-target-48 touch-manipulation tap-feedback min-h-[100px]",
                      loadingBrand === brand.name ? "pointer-events-none opacity-60 bg-gray-50" : ""
                    )}
                    onClick={() => handleBrandClick(brand.name)}
                  >
                    <img
                      src={brand.logo}
                      alt={`${brand.name} logo`}
                      className={cn(
                        "max-h-6 md:max-h-8 lg:max-h-12 max-w-12 md:max-w-16 lg:max-w-20 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity",
                        loadingBrand === brand.name ? "grayscale animate-pulse" : ""
                      )}
                      loading="lazy"
                      style={{ aspectRatio: "3/1", objectFit: "contain" }}
                    />
                    <span className={cn(
                      "text-xs md:text-sm font-medium text-gray-700 mt-2 md:mt-3 text-center leading-tight",
                      loadingBrand === brand.name ? "text-gray-500" : ""
                    )}>
                      {brand.name}
                    </span>
                    {loadingBrand === brand.name && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-xs text-purple-700 font-medium px-2 py-1 bg-white/80 rounded">
                          Loading...
                        </div>
                      </div>
                    )}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </div>
    </div>
  );
};

export default PopularBrandsSection;
