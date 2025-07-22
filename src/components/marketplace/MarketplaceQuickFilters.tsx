
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { MapPin, Tag, DollarSign, Filter } from "lucide-react";
import { useUnifiedMarketplace } from "@/hooks/useUnifiedMarketplace";

const MarketplaceQuickFilters = () => {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const { search } = useUnifiedMarketplace();

  const quickFilters = [
    { id: 'local', label: 'Local Vendors', icon: MapPin },
    { id: 'trending', label: 'Trending', icon: Tag },
    { id: 'under50', label: 'Under $50', icon: DollarSign },
  ];

  const toggleFilter = (filterId: string) => {
    const newActiveFilters = activeFilters.includes(filterId) 
      ? activeFilters.filter(f => f !== filterId)
      : [...activeFilters, filterId];
    
    setActiveFilters(newActiveFilters);
    
    // Apply filter logic through search
    if (filterId === 'local') {
      search("local vendors", { localVendorsOnly: true });
    } else if (filterId === 'trending') {
      search("trending", { trending: true });
    } else if (filterId === 'under50') {
      search("", { maxPrice: 50 });
    }
  };

  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-2 mb-6">
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
  );
};

export default MarketplaceQuickFilters;
