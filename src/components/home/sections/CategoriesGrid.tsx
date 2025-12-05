import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { FullBleedSection } from "@/components/layout/FullBleedSection";
import { ResponsiveContainer } from "@/components/layout/ResponsiveContainer";
import { useToast } from "@/hooks/use-toast";

interface PersonType {
  id: string;
  title: string;
  description: string;
  image: string;
  searchTerm: string;
}

const PersonTypeCarousel = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  
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
      searchTerm: "travel luggage backpacks cameras portable electronics travel accessories gear organizers comfort items neck pillows"
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
    // Navigate with category parameter - ProductCatalogService handles all categories
    console.log(`[CategoriesGrid] Navigating to lifestyle category: ${personType.id}`);
    navigate(`/marketplace?category=${personType.id}`, { 
      state: { fromLifestyle: true, lifestyleType: personType.id }
    });
  };
  
  return (
    <FullBleedSection 
      background="bg-gradient-to-br from-purple-50 to-pink-50" 
      height="auto"
      className="py-16"
    >
      <ResponsiveContainer>
        {/* Clean Page Title */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Gifts for Every Lifestyle
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover thoughtfully curated gifts tailored to different lifestyles and personalities
          </p>
        </div>

        {/* Grid layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {personTypes.map((personType) => (
            <div
              key={personType.id}
              className="group relative overflow-hidden bg-white cursor-pointer h-80 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100"
              onClick={() => handlePersonTypeClick(personType)}
            >
              {/* Image Container */}
              <div className="relative h-full overflow-hidden">
                <img
                  src={personType.image}
                  alt={personType.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                
                {/* Overlay Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-xl font-bold mb-2">
                    {personType.title}
                  </h3>
                  <p className="text-sm text-white/90 mb-4 leading-relaxed">
                    {personType.description}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 transition-all duration-200"
                  >
                    Shop Now
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ResponsiveContainer>
    </FullBleedSection>
  );
};

export default PersonTypeCarousel;
