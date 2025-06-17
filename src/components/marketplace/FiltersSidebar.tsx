
import React from "react";

interface FiltersSidebarProps {
  activeFilters?: any;
  onFilterChange?: (filters: any) => void;
  categories?: string[];
  isMobile?: boolean;
}

const FiltersSidebar: React.FC<FiltersSidebarProps> = ({
  activeFilters,
  onFilterChange,
  categories,
  isMobile = false
}) => {
  return (
    <div className="w-64 p-4 border-r">
      <h3 className="font-semibold mb-4">Filters</h3>
      {/* Filter content will be added later */}
    </div>
  );
};

export default FiltersSidebar;
