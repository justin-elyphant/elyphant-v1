import React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import SimpleFilterContent from "./SimpleFilterContent";

interface AdvancedFiltersDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: any;
  onFiltersChange: (filters: any) => void;
  categories: string[];
  products?: any[]; // Add products for smart detection
}

const AdvancedFiltersDrawer = ({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  categories,
  products = [],
}: AdvancedFiltersDrawerProps) => {
  const isMobile = useIsMobile();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side={isMobile ? "bottom" : "right"} 
        className={isMobile ? "h-[85vh] flex flex-col" : "w-[400px] sm:w-[540px] flex flex-col"}
      >
        <SheetHeader>
          <SheetTitle>Filter Products</SheetTitle>
          <SheetDescription>
            Find exactly what you're looking for with advanced filters
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 overflow-y-auto flex-1 pr-2 max-h-[calc(100vh-12rem)]">
          <SimpleFilterContent
            filters={filters}
            onFiltersChange={onFiltersChange}
            categories={categories}
            products={products}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AdvancedFiltersDrawer;