
import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

// Mock data for popular brands
const popularBrands = [
  { id: 1, name: "Nike", logoUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=128&q=80", productCount: 245 },
  { id: 2, name: "Apple", logoUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=128&q=80", productCount: 189 },
  { id: 3, name: "Samsung", logoUrl: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=128&q=80", productCount: 167 },
  { id: 4, name: "Sony", logoUrl: "https://images.unsplash.com/photo-1593344484362-83d5fa2a98dd?w=128&q=80", productCount: 142 },
  { id: 5, name: "Adidas", logoUrl: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=128&q=80", productCount: 134 },
  { id: 6, name: "Bose", logoUrl: "https://images.unsplash.com/photo-1610041819557-a370a7dfa3f5?w=128&q=80", productCount: 98 },
  { id: 7, name: "Canon", logoUrl: "https://images.unsplash.com/photo-1607462571650-e5b1b2c9f550?w=128&q=80", productCount: 87 },
  { id: 8, name: "Lego", logoUrl: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=128&q=80", productCount: 76 },
];

const PopularBrands = () => {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-6">Featured Brands</h2>
      
      <ScrollArea className="w-full whitespace-nowrap pb-4">
        <div className="flex space-x-4">
          {popularBrands.map((brand) => (
            <Link to="/gifting?tab=products" key={brand.id}>
              <Card key={brand.id} className="min-w-[180px] hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <img 
                      src={brand.logoUrl} 
                      alt={brand.name} 
                      className="w-10 h-10 object-contain"
                      loading="lazy"
                      width="40"
                      height="40"
                    />
                  </div>
                  <h3 className="font-medium text-center">{brand.name}</h3>
                  <p className="text-sm text-gray-500 text-center">
                    {brand.productCount} Products
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default PopularBrands;
