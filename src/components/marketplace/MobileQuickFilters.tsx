
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, DollarSign, Package, Heart } from "lucide-react";

interface MobileQuickFiltersProps {
  activeFilters: Record<string, any>;
  onFilterChange: (filters: Record<string, any>) => void;
  onShowAllFilters: () => void;
}

const MobileQuickFilters = ({
  activeFilters,
  onFilterChange,
  onShowAllFilters
}: MobileQuickFiltersProps) => {
  const quickFilters = [
    {
      key: "under25",
      label: "Under $25",
      icon: <DollarSign className="h-3 w-3" />,
      active: activeFilters.priceRange && activeFilters.priceRange[1] <= 25,
      action: () => onFilterChange({ ...activeFilters, priceRange: [0, 25] })
    },
    {
      key: "under50",
      label: "Under $50",
      icon: <DollarSign className="h-3 w-3" />,
      active: activeFilters.priceRange && activeFilters.priceRange[1] <= 50,
      action: () => onFilterChange({ ...activeFilters, priceRange: [0, 50] })
    },
    {
      key: "rating4",
      label: "4+ Stars",
      icon: <Star className="h-3 w-3 fill-current" />,
      active: activeFilters.rating >= 4,
      action: () => onFilterChange({ ...activeFilters, rating: 4 })
    },
    {
      key: "freeShipping",
      label: "Free Ship",
      icon: <Package className="h-3 w-3" />,
      active: activeFilters.freeShipping,
      action: () => onFilterChange({ ...activeFilters, freeShipping: !activeFilters.freeShipping })
    },
    {
      key: "favorites",
      label: "Favorites",
      icon: <Heart className="h-3 w-3" />,
      active: activeFilters.favoritesOnly,
      action: () => onFilterChange({ ...activeFilters, favoritesOnly: !activeFilters.favoritesOnly })
    }
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
      <div className="flex gap-2 min-w-max">
        {quickFilters.map((filter) => (
          <Button
            key={filter.key}
            variant={filter.active ? "default" : "outline"}
            size="sm"
            className={`flex items-center gap-1 whitespace-nowrap h-8 px-3 text-xs ${
              filter.active 
                ? "bg-gray-900 hover:bg-gray-800 text-white" 
                : "bg-white hover:bg-gray-50"
            }`}
            onClick={filter.action}
          >
            {filter.icon}
            {filter.label}
          </Button>
        ))}
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1 whitespace-nowrap h-8 px-3 text-xs bg-gray-100 hover:bg-gray-200"
          onClick={onShowAllFilters}
        >
          More Filters
        </Button>
      </div>
    </div>
  );
};

export default MobileQuickFilters;
