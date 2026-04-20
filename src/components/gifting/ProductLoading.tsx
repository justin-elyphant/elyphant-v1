
import React from "react";
import { Card, CardContent } from "@/components/ui/card";

const ProductLoading: React.FC = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <Card key={index} className="overflow-hidden">
          <div className="aspect-square bg-muted animate-pulse" />
          <CardContent className="p-4">
            <div className="h-5 bg-muted rounded animate-pulse mb-2" />
            <div className="h-4 bg-muted rounded animate-pulse w-1/2 mb-2" />
            <div className="h-4 bg-muted rounded animate-pulse w-1/4" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProductLoading;
