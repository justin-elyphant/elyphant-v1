
import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { FullWidthSection } from "@/components/layout/FullWidthSection";
import { ResponsiveContainer } from "@/components/layout/ResponsiveContainer";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

interface Collection {
  id: number;
  name: string;
  image: string;
  callToAction: string;
  searchTerm: string;
}

interface FeaturedCollectionsProps {
  collections: Collection[];
}

const FeaturedCollections: React.FC<FeaturedCollectionsProps> = ({ collections }) => {
  const navigate = useNavigate();

  const handleCollectionClick = (searchTerm: string) => {
    // Pass fromHome state to ensure clean filters
    navigate(`/marketplace?search=${encodeURIComponent(searchTerm)}`, { state: { fromHome: true } });
  };

  // Enhanced collections with "best selling" keywords
  const enhancedCollections = collections.map(collection => ({
    ...collection,
    searchTerm: collection.searchTerm.startsWith('best selling') 
      ? collection.searchTerm 
      : `best selling ${collection.searchTerm}`
  }));

  return (
    <FullWidthSection className="py-12 md:py-16 bg-white">
      <ResponsiveContainer className="px-4 md:px-6">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
            Discover Perfect Gifts
          </h2>
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Explore our curated collections to find the perfect gift for any occasion or person in your life
          </p>
        </div>

        {/* Desktop Grid View */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mobile-grid-optimized">
          {enhancedCollections.map((collection) => (
            <div
              key={collection.id}
              className="group relative overflow-hidden rounded-xl bg-white shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer touch-manipulation tap-feedback intersection-target"
              onClick={() => handleCollectionClick(collection.searchTerm)}
            >
              <div className="aspect-square overflow-hidden">
                <img
                  src={collection.image}
                  alt={collection.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 gpu-accelerated"
                  loading="lazy"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-white">
                <h3 className="text-lg md:text-xl font-bold mb-2">{collection.name}</h3>
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 touch-target-44 touch-manipulation no-select"
                >
                  {collection.callToAction}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Carousel */}
        <div className="md:hidden">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full swipe-container will-change-scroll"
          >
            <CarouselContent className="-ml-2">
              {enhancedCollections.map((collection) => (
                <CarouselItem key={collection.id} className="pl-2 basis-4/5 swipe-item">
                  <div
                    className="group relative overflow-hidden rounded-xl bg-white shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer h-64 touch-manipulation tap-feedback"
                    onClick={() => handleCollectionClick(collection.searchTerm)}
                  >
                    <div className="h-full overflow-hidden">
                      <img
                        src={collection.image}
                        alt={collection.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <h3 className="text-lg font-bold mb-2">{collection.name}</h3>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 touch-target-44 touch-manipulation no-select"
                      >
                        {collection.callToAction}
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </ResponsiveContainer>
    </FullWidthSection>
  );
};

export default FeaturedCollections;
