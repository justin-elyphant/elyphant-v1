import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { FullBleedSection } from "@/components/layout/FullBleedSection";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useIsMobile } from "@/hooks/use-mobile";

const giftCategories = [
  {
    id: "gifts-for-her",
    title: "Gifts for Her",
    description: "Thoughtful gifts she'll love",
    image: "/lovable-uploads/53a8bb31-a163-45ec-bb67-ee4bed4cc1db.png?v=2",
    searchTerm: "gifts for her",
    navigationUrl: "/marketplace?search=gifts+for+her"
  },
  {
    id: "gifts-for-him",
    title: "Gifts for Him", 
    description: "Perfect gifts for the special man",
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&h=400&fit=crop",
    searchTerm: "gifts for him",
    navigationUrl: "/marketplace?search=gifts+for+him"
  },
  {
    id: "gifts-under-50",
    title: "Gifts under $50",
    description: "Amazing gifts that won't break the bank",
    image: "/lovable-uploads/d566eefb-d68c-4d0d-beb0-a3a4c0676ae4.png",
    searchTerm: "gifts under 50",
    navigationUrl: "/marketplace?search=gifts+under+50&maxPrice=50"
  },
  {
    id: "luxury-gifts",
    title: "Luxury Gifts",
    description: "Premium gifts for special occasions",
    image: "/lovable-uploads/89069d91-bc3d-4c97-ac4d-70be943ed556.png",
    searchTerm: "luxury gifts",
    navigationUrl: "/marketplace?search=luxury+gifts&minPrice=100"
  }
];

const GiftCategoriesCarousel: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleCategoryClick = (category: typeof giftCategories[0]) => {
    navigate(category.navigationUrl, { state: { fromHome: true } });
  };

  return (
    <FullBleedSection 
      background="bg-white" 
      height="large"
      className="intersection-target"
    >
      {/* Center all content vertically */}
      <div className="flex flex-col justify-center h-full">
        {/* Header content with proper spacing */}
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
            Quick Picks
          </h2>
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Find the perfect gift for any occasion with our curated collections
          </p>
        </div>

      {/* Full-width carousel that bleeds to edges */}
      <div className="relative -mx-4 md:-mx-6">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full swipe-container will-change-scroll"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {giftCategories.map((category) => (
              <CarouselItem key={category.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4 swipe-item">
                <div
                  className="group relative overflow-hidden bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 h-full touch-target-48 touch-manipulation tap-feedback"
                  onClick={() => handleCategoryClick(category)}
                >
                  {/* Image Container - Full bleed within card */}
                  <div className="relative h-48 md:h-56 lg:h-64 overflow-hidden">
                    <img
                      src={category.image}
                      alt={category.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 gpu-accelerated"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    
                    {/* Overlay Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-white">
                      <h3 className="text-lg md:text-xl lg:text-2xl font-bold mb-2">
                        {category.title}
                      </h3>
                      <p className="text-sm md:text-base text-white/90 mb-3 md:mb-4">
                        {category.description}
                      </p>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 transition-all duration-200 touch-target-44 no-select"
                      >
                        Shop Now
                        <ArrowRight className="ml-1 md:ml-2 h-3 w-3 md:h-4 md:w-4 group-hover:translate-x-1 transition-transform duration-200" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          
          {/* Navigation arrows - positioned outside content area */}
          <CarouselPrevious className="hidden md:flex left-2 top-1/2 -translate-y-1/2 bg-white shadow-md border border-gray-200 hover:bg-gray-50 z-10" />
          <CarouselNext className="hidden md:flex right-2 top-1/2 -translate-y-1/2 bg-white shadow-md border border-gray-200 hover:bg-gray-50 z-10" />
        </Carousel>
        </div>
      </div>
    </FullBleedSection>
  );
};

export default GiftCategoriesCarousel;
