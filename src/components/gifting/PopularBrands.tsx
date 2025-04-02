
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

// Mock data for popular brands
const popularBrands = [
  { id: 1, name: "Nike", logoUrl: "/placeholder.svg", productCount: 245 },
  { id: 2, name: "Apple", logoUrl: "/placeholder.svg", productCount: 189 },
  { id: 3, name: "Samsung", logoUrl: "/placeholder.svg", productCount: 167 },
  { id: 4, name: "Sony", logoUrl: "/placeholder.svg", productCount: 142 },
  { id: 5, name: "Adidas", logoUrl: "/placeholder.svg", productCount: 134 },
  { id: 6, name: "Bose", logoUrl: "/placeholder.svg", productCount: 98 },
  { id: 7, name: "Canon", logoUrl: "/placeholder.svg", productCount: 87 },
  { id: 8, name: "Lego", logoUrl: "/placeholder.svg", productCount: 76 },
];

const PopularBrands = () => {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-6">Featured Brands</h2>
      
      <ScrollArea className="w-full whitespace-nowrap pb-4">
        <div className="flex space-x-4">
          {popularBrands.map((brand) => (
            <Card key={brand.id} className="min-w-[180px] hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <img 
                    src={brand.logoUrl} 
                    alt={brand.name} 
                    className="w-10 h-10 object-contain"
                  />
                </div>
                <h3 className="font-medium text-center">{brand.name}</h3>
                <p className="text-sm text-gray-500 text-center">
                  {brand.productCount} Products
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default PopularBrands;
