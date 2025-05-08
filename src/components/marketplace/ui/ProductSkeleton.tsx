
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductSkeletonProps {
  count?: number;
}

const ProductSkeleton = ({ count = 8 }: ProductSkeletonProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border rounded-md overflow-hidden">
          <Skeleton className="h-48 w-full" />
          <div className="p-3">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-2" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductSkeleton;
