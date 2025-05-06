
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

interface ProductSkeletonProps {
  count?: number;
}

const ProductSkeleton = ({ count = 1 }: ProductSkeletonProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="overflow-hidden">
          <Skeleton className="aspect-square w-full h-full" />
          <CardContent className="p-4">
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-2" />
            <Skeleton className="h-4 w-1/4" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProductSkeleton;
