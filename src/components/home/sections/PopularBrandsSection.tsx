import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  const location = useLocation();
  const { products, setProducts } = useProducts();
  const [loadingBrand, setLoadingBrand] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const mountedRef = useRef(true);
  const toastIdsRef = useRef<string[]>([]);
  
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

  // Enhanced cleanup function with more aggressive dismissal
  const cleanupToasts = () => {
    console.log('Cleaning up toasts aggressively, total tracked:', toastIdsRef.current.length);
    
    // Dismiss all tracked toasts
    toastIdsRef.current.forEach(toastId => {
      toast.dismiss(toastId);
    });
    
    // Multiple aggressive cleanup attempts
    toast.dismiss(); // Dismiss all
    setTimeout(() => toast.dismiss(), 100); // Delayed cleanup
    setTimeout(() => toast.dismiss(), 300); // Second delayed cleanup
    
    toastIdsRef.current = [];
  };

  // Cleanup on unmount and route changes
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      console.log('PopularBrandsSection unmounting, cleaning up aggressively');
      mountedRef.current = false;
      if (loadingBrand) {
        setLoadingBrand(null);
      }
      cleanupToasts();
    };
  }, [loadingBrand]);

  // Enhanced route change detection and cleanup
  useEffect(() => {
    const currentPath = location.pathname;
    
    // If we're no longer on the home page, clean up everything
    if (currentPath !== '/') {
      console.log('Route changed away from home, cleaning up all toasts');
      cleanupToasts();
      if (loadingBrand) {
        setLoadingBrand(null);
      }
    }

    const handleBeforeUnload = () => {
      console.log('Page unloading, cleaning up toasts aggressively');
      cleanupToasts();
    };

    const handleRouteChange = () => {
      if (loadingBrand) {
        console.log('Route changing, cleaning up loading state:', loadingBrand);
        setLoadingBrand(null);
        cleanupToasts();
      }
    };

    // Add multiple event listeners for better cleanup coverage
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('pagehide', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('pagehide', handleBeforeUnload);
    };
  }, [location.pathname, loadingBrand]);

  const handleBrandClick = async (brandName: string) => {
    // Prevent multiple clicks and ensure clean state
    if (loadingBrand || !mountedRef.current) {
      console.log('Click ignored - loading or unmounted');
      return;
    }
    
    console.log(`Loading brand: ${brandName}`);
    
    // Aggressive cleanup of any existing toasts first
    cleanupToasts();
    
    setLoadingBrand(brandName);
    
    const loadingToastId = `brand-loading-${brandName}-${Date.now()}`;
    toastIdsRef.current.push(loadingToastId);
    
    const enhancedSearchTerm = `best selling ${brandName} products`;
    
    // Set up shorter timeout for mobile with aggressive cleanup
    const timeoutDuration = isMobile ? 2000 : 3500;
    const timeoutId = setTimeout(() => {
      if (!mountedRef.current) return;
      
      console.log(`Timeout reached for ${brandName}, cleaning up aggressively`);
      setLoadingBrand(null);
      cleanupToasts();
      
      const errorToastId = `error-${brandName}-${Date.now()}`;
      toast.error(`Loading ${brandName} products took too long`, { 
        id: errorToastId,
        duration: 1500
      });
      
      // Navigate anyway
      navigate(`/marketplace?search=${encodeURIComponent(enhancedSearchTerm)}`);
    }, timeoutDuration);
    
    try {
      // Show loading toast with shorter duration
      toast.loading(`Loading ${brandName} products...`, { 
        id: loadingToastId,
        duration: isMobile ? 1200 : 2000
      });
      
      await handleBrandProducts(brandName, products, setProducts);
      
      // Only proceed if component is still mounted
      if (!mountedRef.current) return;
      
      // Clear timeout and loading state immediately on success
      clearTimeout(timeoutId);
      setLoadingBrand(null);
      
      // Aggressive cleanup of loading toast
      cleanupToasts();
      
      // Silently load brand products - no success toast needed
      console.log(`${brandName} products loaded successfully`);
      
      // Navigate to marketplace
      navigate(`/marketplace?search=${encodeURIComponent(enhancedSearchTerm)}`);
      
    } catch (err) {
      if (!mountedRef.current) return;
      
      console.error(`Error loading ${brandName} products:`, err);
      
      // Clear timeout and loading state on error
      clearTimeout(timeoutId);  
      setLoadingBrand(null);
      
      // Aggressive cleanup of loading toast
      cleanupToasts();
      
      const errorToastId = `error-${brandName}-${Date.now()}`;
      toast.error(`Failed to load ${brandName} products`, {
        id: errorToastId,
        duration: 1500
      });
      
      // Still navigate to allow user to see available products
      navigate(`/marketplace?search=${encodeURIComponent(enhancedSearchTerm)}`);
    }
  };

  return (
    <div className="py-12 md:py-16 bg-white intersection-target overflow-hidden">
      {/* Full bleed container for mobile */}
      <div className={isMobile ? "" : "container mx-auto px-4 md:px-6"}>
        <div className={isMobile ? "px-4 mb-8" : "mb-12"}>
          <h2 className="text-2xl md:text-3xl font-bold mb-2 md:mb-3 text-center">Popular Brands</h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Shop from trusted brands our customers love
          </p>
        </div>
        
        <div className="relative">
          <Carousel
            opts={{
              align: "start",
              loop: false,
            }}
            className="w-full swipe-container will-change-scroll"
          >
            <CarouselContent className={isMobile ? "-ml-2" : "-ml-4"}>
              {brands.map((brand) => (
                <CarouselItem key={brand.name} className={`${isMobile ? "pl-2 basis-1/2" : "pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/6"} swipe-item`}>
                  <div
                    className={cn(
                      "relative flex flex-col items-center justify-center rounded-xl bg-white border border-gray-100 hover:shadow-md hover:bg-purple-50 transition cursor-pointer touch-target-48 touch-manipulation tap-feedback",
                      isMobile ? "p-4 mx-2 min-h-[140px]" : "p-3 md:p-4 lg:p-6 min-h-[100px]",
                      loadingBrand === brand.name ? "pointer-events-none opacity-60 bg-gray-50" : ""
                    )}
                    onClick={() => handleBrandClick(brand.name)}
                  >
                    <img
                      src={brand.logo}
                      alt={`${brand.name} logo`}
                      className={cn(
                        "max-w-12 md:max-w-16 lg:max-w-20 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity",
                        isMobile ? "max-h-12" : "max-h-6 md:max-h-8 lg:max-h-12",
                        loadingBrand === brand.name ? "grayscale animate-pulse" : ""
                      )}
                      loading="lazy"
                      style={{ aspectRatio: "3/1", objectFit: "contain" }}
                    />
                    <span className={cn(
                      "font-medium text-gray-700 text-center leading-tight",
                      isMobile ? "text-sm mt-3" : "text-xs md:text-sm mt-2 md:mt-3",
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
          
          {/* Mobile edge gradients for visual depth */}
          {isMobile && (
            <>
              <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />
              <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PopularBrandsSection;
