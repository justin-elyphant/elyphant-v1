
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

interface PersonType {
  id: string;
  title: string;
  description: string;
  image: string;
  searchTerm: string;
}

const PersonTypeCarousel = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const personTypes: PersonType[] = [
    {
      id: "on-the-go",
      title: "On the Go",
      description: "Perfect for busy, active lifestyles",
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&auto=format&fit=crop&q=80",
      searchTerm: "portable electronics travel accessories convenience gadgets on-the-go essentials commuter gear"
    },
    {
      id: "movie-buff",
      title: "Movie Buff",
      description: "For cinema lovers and entertainment enthusiasts",
      image: "/lovable-uploads/9d12d653-19ff-45ff-9666-516bf95d27ad.png",
      searchTerm: "streaming devices home theater popcorn makers entertainment accessories movie collectibles comfort items"
    },
    {
      id: "work-from-home",
      title: "Work From Home",
      description: "Essentials for productive remote work",
      image: "/lovable-uploads/4820a05f-3843-40f5-b22d-9765af82a27a.png",
      searchTerm: "office supplies ergonomic furniture productivity tools desk accessories lighting organization"
    },
    {
      id: "the-traveler",
      title: "The Traveler",
      description: "Adventure-ready gear for wanderers",
      image: "/lovable-uploads/1a9d5356-1759-43e5-b922-26cc22551216.png",
      searchTerm: "luggage travel accessories portable chargers travel comfort international adapters"
    },
    {
      id: "the-home-chef",
      title: "The Home Chef",
      description: "Culinary tools for kitchen enthusiasts",
      image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&auto=format&fit=crop&q=80",
      searchTerm: "kitchen appliances cooking gadgets specialty ingredients cookbooks utensils food storage"
    },
    {
      id: "teens",
      title: "Teens",
      description: "Trendy picks for young adults",
      image: "/lovable-uploads/cbadbc52-4113-4bd6-a899-3b805199f733.png",
      searchTerm: "trendy accessories tech gadgets gaming items room decor study supplies fashion"
    }
  ];
  
  const handlePersonTypeClick = (personType: PersonType) => {
    navigate(`/marketplace?search=${encodeURIComponent(personType.searchTerm)}`, { 
      state: { fromPersonType: true }
    });
  };
  
  return (
    <FullBleedSection 
      background="bg-muted/30" 
      height="large"
      className="intersection-target"
      contentPadding={false}
    >
      {/* Header positioned absolutely over the carousel */}
      <div className="absolute top-8 md:top-12 left-0 right-0 z-20 text-center px-4 md:px-6">
        <h2 className="text-heading-2 md:text-heading-1 text-foreground mb-space-tight md:mb-space-standard">
          Gifts for Every Lifestyle
        </h2>
        <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Discover thoughtfully curated gifts tailored to different lifestyles and personalities
        </p>
      </div>

      {/* True full-bleed carousel */}
      <div className="h-full pt-32 md:pt-40 lg:pt-44">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full h-full swipe-container will-change-scroll"
        >
          <CarouselContent className="h-full">
            {personTypes.map((personType) => (
              <CarouselItem key={personType.id} className="basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4 swipe-item">
                <div
                  className="group relative overflow-hidden bg-background cursor-pointer h-80 md:h-96 lg:h-[500px] touch-target-48 touch-manipulation tap-feedback rounded-2xl"
                  onClick={() => handlePersonTypeClick(personType)}
                >
                  {/* Image Container - Full height of carousel */}
                  <div className="relative h-full overflow-hidden">
                    <img
                      src={personType.image}
                      alt={personType.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 gpu-accelerated"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                    
                    {/* Overlay Content - positioned at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 lg:p-10 text-white">
                      <h3 className="text-xl md:text-2xl lg:text-3xl font-bold mb-3 md:mb-4">
                        {personType.title}
                      </h3>
                      <p className="text-base md:text-lg text-white/90 mb-4 md:mb-6 leading-relaxed">
                        {personType.description}
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
          <CarouselPrevious className="hidden md:flex left-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm shadow-lg border border-border hover:bg-background/90 z-30 w-12 h-12" />
          <CarouselNext className="hidden md:flex right-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm shadow-lg border border-border hover:bg-background/90 z-30 w-12 h-12" />
        </Carousel>
      </div>
    </FullBleedSection>
  );
};

export default PersonTypeCarousel;
