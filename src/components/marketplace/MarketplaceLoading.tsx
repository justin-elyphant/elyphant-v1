
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const MarketplaceLoading = () => {
  return (
    <div className="space-y-8">
      <div className="flex justify-center py-4">
        <div className="flex items-center gap-2 text-primary">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-lg font-medium">Loading products...</p>
        </div>
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
  );
};

export default MarketplaceLoading;
