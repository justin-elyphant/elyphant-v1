
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
  
  const handleBrandClick = (brandName: string) => {
    if (products.length === 0) {
      toast.info("Loading products...");
    } else {
      // Check if there are any products matching this brand name
      const brandProducts = products.filter(p => 
        p.name.toLowerCase().includes(brandName.toLowerCase()) || 
        (p.vendor && p.vendor.toLowerCase().includes(brandName.toLowerCase()))
      );
      
      if (brandProducts.length > 0) {
        toast.success(`Viewing ${brandName} products`);
      } else {
        toast.info(`No ${brandName} products found`);
      }
    }
  };

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold mb-6">Featured Brands</h2>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
        {brands.map((brand) => (
          <Link 
            to={`/marketplace?brand=${encodeURIComponent(brand.name)}`}
            key={brand.id} 
            onClick={() => handleBrandClick(brand.name)}
          >
            <Card className="hover:shadow-md transition-shadow border border-gray-200">
              <CardContent className="p-6 flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3 overflow-hidden">
                  <img 
                    src={brand.logoUrl} 
                    alt={brand.name} 
                    className="w-full h-full object-contain"
                    loading="lazy" 
                    width="40" 
                    height="40"
                    onError={(e) => {
                      // Fallback in case image fails to load
                      (e.target as HTMLImageElement).src = "/placeholder.svg";
                      console.log(`Brand image failed to load: ${brand.name}`);
                    }}
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
