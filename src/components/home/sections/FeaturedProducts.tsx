import React, { useEffect, useState } from "react";
import { productCatalogService } from "@/services/ProductCatalogService";
import { ZincProduct } from "@/components/marketplace/zinc/types";
import UnifiedProductCard from "@/components/marketplace/UnifiedProductCard";
import { Skeleton } from "@/components/ui/skeleton";

interface FeaturedProductsProps {
  searchTerm?: string;
  title?: string;
  maxProducts?: number;
}

const FeaturedProducts = ({ 
  searchTerm = "gift box", 
  title = "Featured Products",
  maxProducts = 35
}: FeaturedProductsProps) => {
  const [products, setProducts] = useState<ZincProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFeaturedProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log(`Loading featured products with search term: ${searchTerm}`);
        
        const response = await productCatalogService.searchProducts(searchTerm, {
          limit: maxProducts
        });
        
        if (response.products && response.products.length > 0) {
          setProducts(response.products);
          console.log(`Loaded ${response.products.length} featured products for "${searchTerm}"`);
        } else {
          console.log(`No products found for search term: ${searchTerm}`);
          setError(`No products found for "${searchTerm}"`);
        }
      } catch (err) {
        console.error("Error loading featured products:", err);
        setError("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedProducts();
  }, [searchTerm, maxProducts]);

  if (loading) {
    return (
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="space-y-3">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">{title}</h2>
        <div className="text-center py-8 text-muted-foreground">
          {error}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">{title}</h2>
        <div className="text-center py-8 text-muted-foreground">
          No featured products available
        </div>
      </div>
    );
  }

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold mb-6">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.slice(0, 12).map((product) => (
          <UnifiedProductCard
            cardType="gifting"
            key={product.product_id} 
            product={{
              id: product.product_id,
              product_id: product.product_id,
              title: product.title,
              name: product.title,
              price: product.price,
              category: product.category,
              image: product.image,
              vendor: product.retailer || "Amazon via Zinc",
              description: product.description,
              rating: product.rating,
              reviewCount: product.review_count
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default FeaturedProducts;
