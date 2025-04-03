
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { useProducts } from "@/contexts/ProductContext";
import { handleBrandProducts } from "@/utils/brandUtils";
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
  const { products, setProducts, isLoading } = useProducts();
  
  useEffect(() => {
    console.log(`FeaturedBrands: ${products.length} products available, isLoading: ${isLoading}`);
  }, [products, isLoading]);
  
  const handleBrandClick = (brandName: string) => {
    console.log(`Brand clicked: ${brandName}, products available: ${products.length}`);
    
    if (products.length === 0) {
      console.log("No products available when brand clicked, will try later via URL param");
      toast.loading("Loading products...", { id: "loading-brand-products" });
    } else {
      // This will find or create products for the brand and add them to the context
      handleBrandProducts(brandName, products, setProducts);
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
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3 overflow-hidden p-2">
                  {brand.name === "Lululemon" ? (
                    <img 
                      src="/lovable-uploads/f0a52aa3-9dcd-4367-9a66-0724e97f2641.png" 
                      alt="Lululemon" 
                      className="max-w-full max-h-full object-contain"
                      loading="lazy" 
                    />
                  ) : (
                    <img 
                      src={brand.logoUrl} 
                      alt={brand.name} 
                      className="max-w-full max-h-full object-contain"
                      loading="lazy" 
                      onError={(e) => {
                        // Fallback for brand images
                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                        console.log(`Brand image fallback used for: ${brand.name}`);
                      }}
                    />
                  )}
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
