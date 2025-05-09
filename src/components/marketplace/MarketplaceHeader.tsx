
import React, { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface MarketplaceHeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onSearch: (event: React.FormEvent) => void;
}

const MarketplaceHeader = ({
  searchTerm,
  setSearchTerm,
  onSearch
}: MarketplaceHeaderProps) => {
  const isMobile = useIsMobile();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch(e);
    }
  };
  
  const handleSearchClick = () => {
    if (isMobile && !isExpanded) {
      setIsExpanded(true);
      return;
    }
    
    if (searchTerm.trim()) {
      onSearch(new Event('submit') as unknown as React.FormEvent);
    }
  };
  
  return (
    <div className="bg-purple-50 dark:bg-gray-800 rounded-lg p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${isExpanded && isMobile ? 'sr-only' : ''}`}>
          Marketplace
        </h1>
        
        <p className={`text-gray-600 dark:text-gray-300 mb-4 ${isExpanded && isMobile ? 'sr-only' : ''}`}>
          Browse our curated selection of gifts for all occasions
        </p>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search for gifts..."
              className="pl-9 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <Button 
            onClick={handleSearchClick}
            className={`${isMobile ? 'w-full' : ''}`}
          >
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceHeader;
