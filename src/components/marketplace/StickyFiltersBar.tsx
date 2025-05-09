
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, Grid, List } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import AdvancedSearch from "./AdvancedSearch";

interface StickyFiltersBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onSearch: (term: string) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  totalItems?: number;
}

const StickyFiltersBar = ({
  searchTerm,
  setSearchTerm,
  onSearch,
  showFilters,
  setShowFilters,
  totalItems = 0,
}: StickyFiltersBarProps) => {
  const isMobile = useIsMobile();
  const [isScrolled, setIsScrolled] = useState(false);
  
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
      className={`sticky top-0 z-30 bg-white border-b py-4 transition-shadow mb-6 ${
        isScrolled ? 'shadow-md' : ''
      }`}
    >
      <div className="container mx-auto flex flex-col gap-4">
        <AdvancedSearch
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onSearch={onSearch}
        />
        
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <Button
              variant={showFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
            </Button>
            
            {totalItems > 0 && (
              <p className="flex items-center text-sm text-muted-foreground">
                {totalItems} item{totalItems !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StickyFiltersBar;
