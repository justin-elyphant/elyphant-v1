
import React from "react";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import FiltersSidebar from "./FiltersSidebar";

interface MobileFiltersDrawerProps {
  activeFilters: any;
  onFilterChange: (filters: any) => void;
  categories: string[];
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
}

const MobileFiltersDrawer: React.FC<MobileFiltersDrawerProps> = ({
  activeFilters,
  onFilterChange,
  categories,
  showFilters,
  setShowFilters,
}) => {
  return (
    <Drawer open={showFilters} onOpenChange={setShowFilters}>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 h-8"
        >
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle>Filter Products</DrawerTitle>
        </DrawerHeader>
        <div className="p-4 overflow-y-auto">
          <FiltersSidebar
            activeFilters={activeFilters}
            onFilterChange={onFilterChange}
            categories={categories}
            isMobile={true}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default MobileFiltersDrawer;
