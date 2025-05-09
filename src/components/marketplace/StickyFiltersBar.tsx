
import React, { useState, useEffect } from "react";
import { Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

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
  totalItems
}: StickyFiltersBarProps) => {
  const isMobile = useIsMobile();
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Start showing sticky bar after scrolling down 200px
      setIsSticky(window.scrollY > 200);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  if (!isSticky) return null;

  return (
    <div className={cn(
      "fixed top-0 left-0 right-0 z-30 bg-white border-b shadow-sm transition-all duration-300 py-2 px-4",
      isSticky ? "translate-y-0" : "-translate-y-full",
      "animate-slide-in-right"
    )}>
      <div className="container mx-auto flex items-center gap-3">
        {isMobile ? (
          <div className="flex w-full gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex-shrink-0"
            >
              <Filter className="h-4 w-4" />
            </Button>
            
            <form onSubmit={handleSearchSubmit} className="flex-1 flex">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search gifts..."
                  className="pl-8 h-9 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </form>
          </div>
        ) : (
          <>
            <form onSubmit={handleSearchSubmit} className="flex-1 flex max-w-sm">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search gifts..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button type="submit" className="ml-2">Find Gifts</Button>
            </form>
            
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="ml-auto"
            >
              <Filter className="h-4 w-4 mr-2" />
              <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
            </Button>
            
            {totalItems !== undefined && (
              <div className="text-sm text-gray-500 ml-4">
                {totalItems} {totalItems === 1 ? 'item' : 'items'} found
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StickyFiltersBar;
