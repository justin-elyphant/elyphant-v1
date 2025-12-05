
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MapPin, Tag, DollarSign, Filter, ChevronDown, Grid3X3 } from "lucide-react";
import { useMarketplace } from "@/hooks/useMarketplace";
import { useNavigate } from "react-router-dom";
import { getFeaturedCategories } from "@/constants/categories";

interface MarketplaceQuickFiltersProps {
  onMoreFilters?: () => void;
}

const MarketplaceQuickFilters = ({ onMoreFilters }: MarketplaceQuickFiltersProps = {}) => {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const { search } = useMarketplace();
  const navigate = useNavigate();

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
      search("local vendors");
    } else if (filterId === 'trending') {
      search("trending");
    } else if (filterId === 'under50') {
      search("under $50");
    }
  };

  const handleCategoryClick = (category: any) => {
    // Enhanced category navigation with brand diversity flag
    if (category.searchTerm) {
      navigate(`/marketplace?search=${encodeURIComponent(category.searchTerm)}&category=${encodeURIComponent(category.value)}&diversity=true`, 
        { state: { fromCategoryOverview: true, enableBrandDiversity: true } });
    } else {
      // Fallback to category-based navigation
      navigate(`/marketplace?category=${encodeURIComponent(category.value)}&diversity=true`, 
        { state: { fromCategoryOverview: true, enableBrandDiversity: true } });
    }
  };

  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-2 mb-6 ios-smooth-scroll">
      <div className="flex items-center gap-2 min-w-max">
        {quickFilters.map((filter) => {
          const Icon = filter.icon;
          const isActive = activeFilters.includes(filter.id);
          
          return (
            <Badge
              key={filter.id}
              variant={isActive ? "default" : "outline"}
              className={`cursor-pointer px-4 py-3 text-sm whitespace-nowrap transition-colors touch-target-44 ${
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
        
        {/* Categories Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="min-h-[44px] px-4 py-3 text-sm font-semibold bg-white text-gray-700 hover:bg-gray-50 border-gray-300 rounded-full border transition-colors touch-target-44"
            >
              <Grid3X3 className="h-3 w-3 mr-1" />
              Categories
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            className="w-56 max-h-80 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg" 
            sideOffset={5}
            align="start"
          >
            {getFeaturedCategories().map((category) => (
              <DropdownMenuItem
                key={category.id}
                onClick={() => handleCategoryClick(category)}
                className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              >
                {category.icon && <category.icon className="h-4 w-4 mr-3 text-gray-500 dark:text-gray-400" />}
                <div>
                  <div className="font-medium">{category.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{category.description}</div>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* More Filters Button */}
        <Badge
          variant="outline"
          className="cursor-pointer px-4 py-3 text-sm bg-white text-gray-700 hover:bg-gray-50 border-gray-300 touch-target-44"
          onClick={onMoreFilters}
        >
          <Filter className="h-3 w-3 mr-1" />
          More filters
        </Badge>
      </div>
    </div>
  );
};

export default MarketplaceQuickFilters;
