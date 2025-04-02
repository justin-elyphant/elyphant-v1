
import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

type BrandsProps = {
  brands: {
    id: number;
    name: string;
    logoUrl: string;
    productCount: number;
  }[];
};

const FeaturedBrands = ({ brands }: BrandsProps) => {
  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold mb-6">Featured Brands</h2>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
        {brands.map((brand) => (
          <Link to="/gifting" key={brand.id}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <img 
                    src={brand.logoUrl} 
                    alt={brand.name} 
                    className="w-10 h-10 object-contain"
                    loading="lazy" 
                    width="40" 
                    height="40"
                  />
                </div>
                <h3 className="font-medium text-center text-sm">{brand.name}</h3>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default FeaturedBrands;
