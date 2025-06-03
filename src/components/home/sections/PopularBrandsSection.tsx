
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProducts } from "@/contexts/ProductContext";
import { handleBrandProducts } from "@/utils/brandUtils";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
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

  const handleBrandClick = async (brandName: string) => {
    setLoadingBrand(brandName);
    const loadingToastId = `brand-loading-${brandName}`;
    toast.loading(`Loading ${brandName} products...`, { id: loadingToastId });
    
    try {
      await handleBrandProducts(brandName, products, setProducts);
      toast.dismiss(loadingToastId);
    } catch (err) {
      toast.dismiss(loadingToastId);
      toast.error(`Failed to load ${brandName} products`);
    } finally {
      setLoadingBrand(null);
      navigate(`/marketplace?search=${encodeURIComponent(brandName)}`);
    }
  };

  return (
    <div className="py-16 bg-white">
      <div className="container px-4">
        <h2 className="text-3xl font-bold mb-3 text-center">Popular Brands</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Shop from trusted brands our customers love
        </p>
        
        <div className="relative">
          <Carousel
            opts={{
              align: "start",
              loop: false,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {brands.map((brand) => (
                <CarouselItem key={brand.name} className="pl-2 md:pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/6">
                  <div
                    className={`relative flex flex-col items-center justify-center p-4 md:p-6 rounded-xl bg-white border border-gray-100 hover:shadow-md hover:bg-purple-50 transition cursor-pointer touch-manipulation min-h-[100px] ${loadingBrand === brand.name ? "pointer-events-none opacity-60" : ""}`}
                    onClick={() => handleBrandClick(brand.name)}
                  >
                    <img
                      src={brand.logo}
                      alt={`${brand.name} logo`}
                      className={`max-h-8 md:max-h-12 max-w-16 md:max-w-20 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity ${loadingBrand === brand.name ? "grayscale" : ""}`}
                      loading="lazy"
                      style={{ aspectRatio: "3/1", objectFit: "contain" }}
                    />
                    <span className="text-xs md:text-sm font-medium text-gray-700 mt-2 md:mt-3 text-center">{brand.name}</span>
                    {loadingBrand === brand.name && (
                      <div className="absolute text-xs text-purple-700 font-medium left-1/2 -translate-x-1/2 mt-16">
                        Loading...
                      </div>
                    )}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-2 md:-left-12" />
            <CarouselNext className="right-2 md:-right-12" />
          </Carousel>
        </div>
      </div>
    </div>
  );
};

export default PopularBrandsSection;
