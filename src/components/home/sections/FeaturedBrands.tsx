
import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { useProducts } from "@/contexts/ProductContext";
import { toast } from "sonner";

type BrandsProps = {
  brands: {
    id: number;
    name: string;
    logoUrl: string;
    productCount: number;
  }[];
};

const FeaturedBrands = ({ brands }: BrandsProps) => {
  const { products } = useProducts();
  
  // Use real brands data if not provided
  const defaultBrands = [
    { id: 1, name: "Nike", logoUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=128&q=80", productCount: 245 },
    { id: 2, name: "Apple", logoUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=128&q=80", productCount: 189 },
    { id: 3, name: "Lego", logoUrl: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=128&q=80", productCount: 167 },
    { id: 4, name: "Sony", logoUrl: "https://images.unsplash.com/photo-1593344484362-83d5fa2a98dd?w=128&q=80", productCount: 142 },
    { id: 5, name: "Samsung", logoUrl: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=128&q=80", productCount: 134 },
    { id: 6, name: "Adidas", logoUrl: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=128&q=80", productCount: 98 },
  ];
  
  const displayBrands = brands && brands.length > 0 ? brands : defaultBrands;

  const handleBrandClick = (brandName: string) => {
    if (products.length === 0) {
      toast.info("Loading products...");
    }
  };

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold mb-6">Featured Brands</h2>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
        {displayBrands.map((brand) => (
          <Link 
            to="/gifting?tab=products" 
            key={brand.id} 
            state={{ brandFilter: brand.name }}
            onClick={() => handleBrandClick(brand.name)}
          >
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
