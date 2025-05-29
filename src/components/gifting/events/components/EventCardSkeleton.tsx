
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const EventCardSkeleton = () => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-20" />
        </div>
        
        <Skeleton className="h-16 w-full" />
        
        <div className="flex space-x-2">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 w-8" />
        </div>
      </CardContent>
    </Card>
  );
};

export default EventCardSkeleton;
