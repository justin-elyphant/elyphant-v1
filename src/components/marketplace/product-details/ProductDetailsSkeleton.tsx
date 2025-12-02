import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

const ProductDetailsSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-elyphant-grey pb-safe">
      {/* Header skeleton */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <Skeleton className="h-11 w-32" />
        </div>
      </div>
      
      {/* 60/40 Split Layout */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* LEFT 60%: Image Gallery Skeleton */}
          <div className="col-span-12 lg:col-span-7 space-y-4">
            {/* Main image */}
            <Skeleton className="aspect-square w-full rounded-lg" />
            
            {/* Thumbnail strip */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="w-16 h-16 rounded-md flex-shrink-0" />
              ))}
            </div>
          </div>
          
          {/* RIGHT 40%: Product Details Sidebar Skeleton */}
          <div className="col-span-12 lg:col-span-5 space-y-6">
            {/* Brand */}
            <Skeleton className="h-4 w-20" />
            
            {/* Title */}
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-3/4" />
            </div>
            
            {/* Price and Rating */}
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-5 w-32" />
            </div>
            
            {/* Variation selectors */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <div className="flex gap-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-16 rounded-md" />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-12" />
                <div className="flex gap-2 flex-wrap">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-12 rounded-md" />
                  ))}
                </div>
              </div>
            </div>
            
            {/* CTA Buttons */}
            <div className="space-y-3 pt-4">
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
            
            {/* Description */}
            <div className="space-y-2 pt-4">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsSkeleton;
