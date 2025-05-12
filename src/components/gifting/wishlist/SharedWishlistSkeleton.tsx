
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AspectRatio } from "@/components/ui/aspect-ratio";

const SharedWishlistSkeleton = () => {
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="w-full md:w-2/3">
          <Skeleton className="h-3 w-20 mb-3" />
          <Skeleton className="h-8 w-3/4 mb-3" />
          <Skeleton className="h-4 w-full" />
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center">
            <Skeleton className="h-8 w-8 rounded-full mr-2" />
            <div>
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          
          <Skeleton className="h-8 w-28" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, idx) => (
          <Card key={idx} className="overflow-hidden">
            <AspectRatio ratio={1}>
              <Skeleton className="h-full w-full" />
            </AspectRatio>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3 mb-2" />
              <Skeleton className="h-3 w-3/4 mb-4" />
              <Skeleton className="h-3 w-1/2 mb-4" />
              <Skeleton className="h-8 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SharedWishlistSkeleton;
