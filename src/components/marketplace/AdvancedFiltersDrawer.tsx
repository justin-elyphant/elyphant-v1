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
}

const AdvancedFiltersDrawer = ({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  categories,
}: AdvancedFiltersDrawerProps) => {
  const isMobile = useIsMobile();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side={isMobile ? "bottom" : "right"} 
        className={isMobile ? "h-[85vh]" : "w-[400px] sm:w-[540px]"}
      >
        <SheetHeader>
          <SheetTitle>Filter Products</SheetTitle>
          <SheetDescription>
            Find exactly what you're looking for with advanced filters
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6">
          <SimpleFilterContent
            filters={filters}
            onFiltersChange={onFiltersChange}
            categories={categories}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AdvancedFiltersDrawer;