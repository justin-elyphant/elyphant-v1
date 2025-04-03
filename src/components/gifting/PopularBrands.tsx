
import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

// Mock data for popular brands with real logos
const popularBrands = [
  { 
    id: 1, 
    name: "Nike", 
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_NIKE.svg/1200px-Logo_NIKE.svg.png", 
    productCount: 245 
  },
  { 
    id: 2, 
    name: "Apple", 
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg", 
    productCount: 189 
  },
  { 
    id: 3, 
    name: "Samsung", 
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Samsung_Logo.svg/2560px-Samsung_Logo.svg.png", 
    productCount: 167 
  },
  { 
    id: 4, 
    name: "Sony", 
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Sony_logo.svg/2560px-Sony_logo.svg.png", 
    productCount: 142 
  },
  { 
    id: 5, 
    name: "Adidas", 
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Adidas_Logo.svg/2560px-Adidas_Logo.svg.png", 
    productCount: 134 
  },
  { 
    id: 6, 
    name: "Bose", 
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Bose_logo.svg/2560px-Bose_logo.svg.png", 
    productCount: 98 
  },
  { 
    id: 7, 
    name: "Canon", 
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Canon_logo.svg/2560px-Canon_logo.svg.png", 
    productCount: 87 
  },
  { 
    id: 8, 
    name: "Lego", 
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/LEGO_logo.svg/2048px-LEGO_logo.svg.png", 
    productCount: 76 
  },
];

const PopularBrands = () => {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-6">Featured Brands</h2>
      
      <ScrollArea className="w-full whitespace-nowrap pb-4">
        <div className="flex space-x-4">
          {popularBrands.map((brand) => (
            <Link to={`/marketplace?brand=${encodeURIComponent(brand.name)}`} key={brand.id}>
              <Card key={brand.id} className="min-w-[180px] hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 overflow-hidden">
                    <img 
                      src={brand.logoUrl} 
                      alt={brand.name} 
                      className="w-10 h-10 object-contain"
                      loading="lazy"
                      width="40"
                      height="40"
                      onError={(e) => {
                        // Fallback in case image fails to load
                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                      }}
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
