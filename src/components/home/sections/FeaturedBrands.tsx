
import React, { useState } from "react";
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
  const { products, setProducts } = useProducts();
  const [loadingBrand, setLoadingBrand] = useState<string | null>(null);
  
  const handleBrandClick = async (brandName: string) => {
    console.log(`Brand clicked: ${brandName}, products available: ${products.length}`);
    
    // Set loading state for this specific brand
    setLoadingBrand(brandName);
    
    try {
      // This will fetch products for the brand from the Zinc API
      await handleBrandProducts(brandName, products, setProducts);
    } catch (error) {
      console.error(`Error loading ${brandName} products:`, error);
      toast.error(`Failed to load ${brandName} products`, { id: "loading-brand-products" });
    } finally {
      // Clear loading state
      setLoadingBrand(null);
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
            className={loadingBrand === brand.name ? "pointer-events-none opacity-70" : ""}
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
                {loadingBrand === brand.name && (
                  <div className="mt-2 text-xs text-blue-500">Loading...</div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default FeaturedBrands;
