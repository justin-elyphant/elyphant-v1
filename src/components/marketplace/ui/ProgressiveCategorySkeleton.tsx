import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ProgressiveCategorySkeletonProps {
  className?: string;
  categoryCount?: number;
  showAnimation?: boolean;
}

const ProgressiveCategorySkeleton: React.FC<ProgressiveCategorySkeletonProps> = ({ 
  className,
  categoryCount = 6,
  showAnimation = true
}) => {
  return (
    <div className={cn("space-y-8", className)}>
      {Array.from({ length: categoryCount }, (_, categoryIndex) => {
        const hasBackground = categoryIndex % 2 === 1;
        const isImmediate = categoryIndex < 2;
        
        return (
          <div 
            key={categoryIndex}
            className={cn(
              "transition-all duration-300",
              hasBackground ? 'bg-muted/30 py-8 px-4 rounded-lg' : 'py-4',
              showAnimation && !isImmediate && "animate-pulse opacity-60"
            )}
          >
            {/* Category Title and Subtitle */}
            <div className="mb-6">
              <Skeleton className="h-7 w-80 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
            
            {/* Product Grid */}
            <div className="relative">
              <div className="flex gap-4 overflow-hidden">
                {Array.from({ length: 8 }, (_, productIndex) => (
                  <div 
                    key={productIndex}
                    className="flex-shrink-0 w-48"
                    style={{
                      animationDelay: showAnimation ? `${productIndex * 100}ms` : '0ms'
                    }}
                  >
                    {/* Product Card Skeleton */}
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden border">
                      {/* Product Image */}
                      <Skeleton className="aspect-square w-full" />
                      
                      {/* Product Info */}
                      <div className="p-3 space-y-2">
                        {/* Product Title */}
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-3/4" />
                        
                        {/* Rating */}
                        <div className="flex items-center gap-1">
                          <Skeleton className="h-3 w-12" />
                          <Skeleton className="h-3 w-8" />
                        </div>
                        
                        {/* Price */}
                        <Skeleton className="h-5 w-16" />
                        
                        {/* Vendor */}
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Gradient Overlay */}
              <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent pointer-events-none" />
            </div>
            
            {/* See All Button Skeleton */}
            <div className="mt-4 flex justify-center">
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProgressiveCategorySkeleton;