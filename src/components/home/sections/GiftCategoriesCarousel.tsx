
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
      image: "/lovable-uploads/5f6e5bfc-2084-47e5-b28d-5fea068c2b93.png",
      searchTerm: "gifts for her categories",
      navigationUrl: "/marketplace?category=gifts-for-her"
    },
  {
    id: "gifts-for-him",
    title: "Gifts for Him", 
    description: "Perfect gifts for the special man",
    image: "/lovable-uploads/19ec9b7e-120d-40e6-a4f2-2a411add14fb.png",
    searchTerm: "gifts for him categories",
    navigationUrl: "/marketplace?category=gifts-for-him"
  },
  {
    id: "gifts-under-50",
    title: "Gifts under $50",
    description: "Amazing gifts that won't break the bank",
    image: "/lovable-uploads/9c28137d-7145-44ee-a958-177f61bb637a.png",
    searchTerm: "gifts under $50 categories",
    navigationUrl: "/marketplace?category=gifts-under-50"
  },
  {
    id: "luxury-gifts",
    title: "Luxury Gifts",
    description: "Premium gifts for special occasions",
    image: "/lovable-uploads/89069d91-bc3d-4c97-ac4d-70be943ed556.png",
    searchTerm: "luxury categories",
    navigationUrl: "/marketplace?category=luxury"
  }
];

const GiftCategoriesCarousel: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleCategoryClick = (category: typeof giftCategories[0]) => {
    console.log(`[GiftCategoriesCarousel] Navigating to: ${category.title} -> ${category.navigationUrl}`);
    navigate(category.navigationUrl, { state: { fromHome: true } });
  };

  return (
    <FullBleedSection 
      background="bg-white" 
      height="large"
      className="intersection-target"
      contentPadding={false}
    >
      {/* Header with improved background for better visibility */}
      <div className="absolute top-8 md:top-12 left-0 right-0 z-20 text-center px-4 md:px-6">
        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-6 md:p-8 mx-auto max-w-4xl border border-white/20">
          <h2 className="text-heading-2 md:text-heading-1 text-foreground mb-space-tight">
            Quick Picks
          </h2>
          <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Find the perfect gift for any occasion with our curated collections
          </p>
        </div>
      </div>

      {/* True full-bleed carousel */}
      <div className="h-full pt-40 md:pt-48 lg:pt-52">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full h-full swipe-container will-change-scroll"
        >
          <CarouselContent className="h-full">
            {giftCategories.map((category) => (
              <CarouselItem key={category.id} className="basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4 swipe-item">
                <div
                  className="group relative overflow-hidden card-unified cursor-pointer h-80 md:h-96 lg:h-[500px] touch-target-48 touch-manipulation tap-feedback"
                  onClick={() => handleCategoryClick(category)}
                >
                  {/* Image Container - Full height of carousel */}
                  <div className="relative h-full overflow-hidden">
                    <img
                      src={category.image}
                      alt={category.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 gpu-accelerated"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                    
                     {/* Overlay Content - positioned at bottom */}
                     <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 lg:p-10">
                       <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-3 md:mb-4 drop-shadow-lg">
                         {category.title}
                       </h3>
                       <p className="text-base md:text-lg text-white/90 mb-4 md:mb-6 leading-relaxed drop-shadow-md">
                         {category.description}
                       </p>
                      <Button
                        variant="secondary"
                        size="lg"
                        className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 transition-all duration-200 touch-target-44 no-select text-base md:text-lg px-6 py-3"
                      >
                        Shop Now
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          
          {/* Navigation arrows - positioned outside content area */}
          <CarouselPrevious className="hidden md:flex left-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm shadow-lg border border-white/20 hover:bg-white/90 z-30 w-12 h-12" />
          <CarouselNext className="hidden md:flex right-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm shadow-lg border border-white/20 hover:bg-white/90 z-30 w-12 h-12" />
        </Carousel>
      </div>
    </FullBleedSection>
  );
};

export default GiftCategoriesCarousel;
