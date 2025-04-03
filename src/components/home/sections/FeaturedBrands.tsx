
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
  const { products, setProducts } = useProducts();
  
  const handleBrandClick = (brandName: string) => {
    if (products.length === 0) {
      toast.info("Loading products...");
      return;
    }
    
    // Check if we have any products for this brand with a more flexible matching
    const productsByBrand = products.filter(p => 
      p.name.toLowerCase().includes(brandName.toLowerCase()) || 
      (p.vendor && p.vendor.toLowerCase().includes(brandName.toLowerCase()))
    );
    
    if (productsByBrand.length === 0) {
      // No products found for this brand, so create some temporary ones
      const tempProducts = [...products];
      
      // Create 5 products for this brand
      for (let i = 0; i < 5; i++) {
        const randomProduct = products[Math.floor(Math.random() * products.length)];
        if (randomProduct) {
          tempProducts.push({
            ...randomProduct,
            id: 10000 + products.length + i, // Ensure unique ID
            name: `${brandName} ${randomProduct.name.split(' ').slice(1).join(' ')}`,
            vendor: brandName,
            category: randomProduct.category || "Clothing",
            description: `Premium ${brandName} ${randomProduct.category || "item"} with exceptional quality and style.`
          });
        }
      }
      
      // Update products in context
      setProducts(tempProducts);
      toast.success(`${brandName} products added to catalog`);
    } else {
      toast.success(`Viewing ${brandName} products`);
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
