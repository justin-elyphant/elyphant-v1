
import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface MarketplaceHeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onSearch: () => void;
  totalResults?: number;
}

const MarketplaceHeader = ({
  searchTerm,
  setSearchTerm,
  onSearch,
  totalResults
}: MarketplaceHeaderProps) => {
  const isMobile = useIsMobile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <div className="mb-6">
      <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} justify-between items-center mb-4`}>
        <h1 className={`text-2xl font-semibold text-gray-900 ${isMobile ? 'mb-4 text-center w-full' : ''}`}>
          Gift Marketplace
        </h1>
        {totalResults !== undefined && (
          <div className="text-sm text-gray-500">
            {totalResults} {totalResults === 1 ? 'item' : 'items'} found
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search for gifts..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button type="submit">{isMobile ? "Search" : "Find Gifts"}</Button>
      </form>
    </div>
  );
};

export default MarketplaceHeader;
