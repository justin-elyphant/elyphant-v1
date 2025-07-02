
import React from "react";
import { cn } from "@/lib/utils";

interface ProductSkeletonProps {
  className?: string;
  count?: number;
  viewMode?: "grid" | "list";
}

const ProductSkeleton: React.FC<ProductSkeletonProps> = ({ 
  className, 
  count = 6, 
  viewMode = "grid" 
}) => {
  const skeletons = Array.from({ length: count }, (_, i) => i);

  if (viewMode === "list") {
    return (
      <div className={cn("space-y-4", className)}>
        {skeletons.map((i) => (
          <div key={i} className="flex gap-4 p-4 bg-white rounded-lg shadow-sm">
            <div className="w-24 h-24 bg-gray-200 rounded-lg animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4", className)}>
      {skeletons.map((i) => (
        <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="aspect-square bg-gray-200 animate-pulse" />
          <div className="p-3 space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductSkeleton;
