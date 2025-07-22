
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, MapPin, Tag, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUnifiedMarketplace } from "@/hooks/useUnifiedMarketplace";

interface AirbnbStyleSearchBarProps {
  onSearch?: (term: string) => void;
  showFilters?: boolean;
}

const AirbnbStyleSearchBar: React.FC<AirbnbStyleSearchBarProps> = ({
  onSearch,
  showFilters = true
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const { search } = useUnifiedMarketplace();

  const handleSearch = () => {
    if (onSearch) {
      onSearch(searchTerm);
    } else {
      search(searchTerm);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const quickFilters = [
    { id: 'local', label: 'Local Vendors', icon: MapPin },
    { id: 'trending', label: 'Trending', icon: Tag },
    { id: 'under50', label: 'Under $50', icon: DollarSign },
  ];

  const toggleFilter = (filterId: string) => {
    setActiveFilters(prev => 
      prev.includes(filterId) 
        ? prev.filter(f => f !== filterId)
        : [...prev, filterId]
    );
  };

  return (
    <div className="space-y-4">
      {/* Main Search Bar - Airbnb Style */}
      <Card className="p-2 shadow-lg border-0 rounded-full">
        <div className="flex items-center">
          {/* Search Input */}
          <div className="flex-1 px-4">
            <Input
              type="text"
              placeholder="Search for products, brands, or experiences..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              className="border-0 bg-transparent text-base placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          
          {/* Search Button */}
          <Button 
            onClick={handleSearch}
            className="rounded-full bg-rose-500 hover:bg-rose-600 text-white px-6 py-3 h-auto"
          >
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>
      </Card>

      {/* Quick Filters */}
      {showFilters && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          <div className="flex items-center gap-2 min-w-max">
            {quickFilters.map((filter) => {
              const Icon = filter.icon;
              const isActive = activeFilters.includes(filter.id);
              
              return (
                <Badge
                  key={filter.id}
                  variant={isActive ? "default" : "outline"}
                  className={`cursor-pointer px-3 py-2 text-sm whitespace-nowrap transition-colors ${
                    isActive 
                      ? "bg-gray-900 text-white hover:bg-gray-800" 
                      : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
                  }`}
                  onClick={() => toggleFilter(filter.id)}
                >
                  <Icon className="h-3 w-3 mr-1" />
                  {filter.label}
                </Badge>
              );
            })}
            
            {/* More Filters Button */}
            <Badge
              variant="outline"
              className="cursor-pointer px-3 py-2 text-sm bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
            >
              <Filter className="h-3 w-3 mr-1" />
              More filters
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
};

export default AirbnbStyleSearchBar;
