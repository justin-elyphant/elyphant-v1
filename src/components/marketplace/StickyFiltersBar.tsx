
import React, { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserSearchHistory } from "@/hooks/useUserSearchHistory";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

interface StickyFiltersBarProps {
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  totalItems?: number;
  searchTerm?: string;
  onRecentSearchClick?: (search: string) => void;
}

const StickyFiltersBar = ({
  showFilters,
  setShowFilters,
  totalItems = 0,
  searchTerm,
  onRecentSearchClick,
}: StickyFiltersBarProps) => {
  const isMobile = useIsMobile();
  const [isScrolled, setIsScrolled] = useState(false);
  const { recentSearches } = useUserSearchHistory();
  
  // Track scroll position to apply sticky styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 180);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div 
      className={`sticky top-[116px] z-20 bg-white border-b py-4 transition-shadow mb-6 ${isScrolled ? "shadow-md" : ""}`}
    >
      <div className="container mx-auto flex flex-col gap-2">
        {/* Filter Toggle - only show if not in recent searches area */}
        {recentSearches.length === 0 && (
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
          </div>
        )}

        {/* Recent searches - separate from filter toggle */}
        {recentSearches.length > 0 && (
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-muted-foreground font-medium">Recent:</span>
            </div>
            
            <Carousel
              opts={{
                align: "start",
                slidesToScroll: isMobile ? 1 : 2,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-2">
                {recentSearches.map((term, idx) => (
                  <CarouselItem key={term + idx} className="pl-2 basis-auto">
                    <button
                      className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-purple-700 font-semibold text-xs shadow-sm border border-purple-200 hover:bg-purple-200 transition-all focus:outline-none focus:ring-2 focus:ring-purple-400 whitespace-nowrap"
                      type="button"
                      style={{ lineHeight: 1.2 }}
                      onClick={() => onRecentSearchClick?.(term)}
                      aria-label={`Search again for ${term}`}
                    >
                      {term}
                    </button>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {searchTerm && (
              <div className="hidden xs:flex text-sm">
                Search results for: <span className="font-medium ml-1">"{searchTerm}"</span>
              </div>
            )}
          </div>
          
          {totalItems > 0 && (
            <div className="text-sm text-gray-600">
              {totalItems} products found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StickyFiltersBar;
