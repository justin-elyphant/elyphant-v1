
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const MarketplaceLoading = () => {
  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="border-b bg-white p-4">
        <div className="container mx-auto">
          {/* Header skeleton */}
          <div className="h-8 bg-gray-200 rounded-md w-32 animate-pulse mb-4"></div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-6 bg-gray-200 rounded-md w-24 animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 pt-6 space-y-8">
        {/* Search bar skeleton */}
        <div className="h-12 bg-gray-200 rounded-lg w-full animate-pulse"></div>
        
        {/* Categories skeleton */}
        <div className="space-y-2">
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-md animate-pulse"></div>
            ))}
          </div>
        </div>
        
        {/* Product grid skeleton */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Card key={index} className="overflow-hidden">
                <div className="aspect-square bg-gray-200 animate-pulse" />
                <CardContent className="p-4">
                  <div className="h-5 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2 mb-2" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceLoading;
