
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface StickyFiltersBarProps {
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  totalItems?: number;
  searchTerm?: string;
}

const StickyFiltersBar = ({
  showFilters,
  setShowFilters,
  totalItems = 0,
  searchTerm
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
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center"
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            {showFilters ? "Hide Filters" : "Filters"}
          </Button>
          
          {searchTerm && (
            <div className="hidden xs:flex text-sm">
              Search results for: <span className="font-medium ml-1">"{searchTerm}"</span>
            </div>
          )}
        </div>
        
        {totalItems > 0 && (
          <div className="text-sm text-muted-foreground">
            {totalItems} {totalItems === 1 ? 'item' : 'items'}
          </div>
        )}
      </div>
    </div>
  );
};

export default StickyFiltersBar;
