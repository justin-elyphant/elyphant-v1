
import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { FullBleedSection } from "@/components/layout/FullBleedSection";

interface PersonType {
  id: string;
  title: string;
  description: string;
  image: string;
  searchTerm: string;
}

const PersonTypeCarousel = () => {
  const navigate = useNavigate();
  
  
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
      {/* Header with improved background for better visibility */}
      <div className="absolute top-8 md:top-12 left-0 right-0 z-20 text-center px-4 md:px-6">
        <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg p-6 md:p-8 mx-auto max-w-4xl border border-border/20">
          <h2 className="text-heading-2 md:text-heading-1 text-foreground mb-space-tight">
            Gifts for Every Lifestyle
          </h2>
          <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Discover thoughtfully curated gifts tailored to different lifestyles and personalities
          </p>
        </div>
      </div>

      {/* Grid layout with container padding */}
      <div className="container mx-auto px-4 md:px-6 pt-40 md:pt-48 lg:pt-52 pb-8 md:pb-12">
        {/* Grid layout for mobile-first approach */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {personTypes.map((personType) => (
            <div
              key={personType.id}
              className="group relative overflow-hidden bg-background cursor-pointer h-80 md:h-96 lg:h-[400px] touch-target-48 touch-manipulation tap-feedback rounded-2xl"
              onClick={() => handlePersonTypeClick(personType)}
            >
              {/* Image Container - Full height */}
              <div className="relative h-full overflow-hidden">
                <img
                  src={personType.image}
                  alt={personType.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 gpu-accelerated"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                
                {/* Overlay Content - positioned at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 lg:p-8 text-white">
                  <h3 className="text-lg md:text-xl lg:text-2xl font-bold mb-2 md:mb-3">
                    {personType.title}
                  </h3>
                  <p className="text-sm md:text-base text-white/90 mb-3 md:mb-4 leading-relaxed">
                    {personType.description}
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 transition-all duration-200 touch-target-44 no-select text-sm md:text-base px-4 py-2"
                  >
                    Shop Now
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </FullBleedSection>
  );
};

export default PersonTypeCarousel;
