import React, { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRecentSearches, getRecentSearches } from "./hooks/useRecentSearches";

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
  
  // Track scroll position to apply sticky styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 180);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // New: Get last 5 recent searches; reloads on every render for simplicity
  const recentSearches = getRecentSearches();

  return (
    <div 
      className={`sticky top-0 z-30 bg-white border-b py-4 transition-shadow mb-6 ${isScrolled ? "shadow-md" : ""}`}
    >
      <div className="container mx-auto flex flex-col gap-2">
        {/* Recently searched terms */}
        {recentSearches.length > 0 && (
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs text-muted-foreground mr-2 font-medium">Recent:</span>
            {recentSearches.map((term, idx) => (
              <button
                key={term + idx}
                className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-purple-700 font-semibold text-xs shadow-sm border border-purple-200 hover:bg-purple-200 transition-all focus:outline-none focus:ring-2 focus:ring-purple-400"
                type="button"
                style={{ lineHeight: 1.2 }}
                onClick={() => onRecentSearchClick?.(term)}
                aria-label={`Search again for ${term}`}
              >
                {term}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Moved filter toggle button to product grid header */}
            {searchTerm && (
              <div className="hidden xs:flex text-sm">
                Search results for: <span className="font-medium ml-1">"{searchTerm}"</span>
              </div>
            )}
          </div>
          {/* Removed the item counter from here */}
        </div>
      </div>
    </div>
  );
};

export default StickyFiltersBar;
