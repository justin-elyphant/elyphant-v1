import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";
import UnifiedProductCard from "@/components/marketplace/UnifiedProductCard";
import ProductSkeleton from "@/components/marketplace/loading/ProductSkeleton";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const mapDbProductToProduct = (row: any): Product => ({
  product_id: row.product_id || row.id,
  title: row.title || "",
  price: row.price || 0,
  image: row.image_url || "/placeholder.svg",
  category: row.category || "general",
  vendor: row.retailer || "Amazon",
  retailer: row.retailer || "Amazon",
  brand: row.brand || "",
  rating: row.metadata?.stars || 0,
  stars: row.metadata?.stars || 0,
  reviewCount: row.metadata?.review_count || 0,
  review_count: row.metadata?.review_count || 0,
  description: row.metadata?.product_description || "",
  images: row.metadata?.images || [],
  metadata: row.metadata || {},
  productSource: "zinc_api" as const,
  isZincApiProduct: true,
});

interface BrandAllItemsProps {
  brandName: string;
  brandSearchTerm: string;
}

const BrandAllItems: React.FC<BrandAllItemsProps> = ({ brandName, brandSearchTerm }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        // Query products table filtered by brand name or title containing brand
        const brandLower = brandName.toLowerCase();
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .or(`brand.ilike.%${brandLower}%,title.ilike.%${brandLower}%`)
          .order("view_count", { ascending: false })
          .limit(24);

        if (error) {
          console.error("[BrandAllItems] query error:", error);
          return;
        }

        setProducts((data || []).map(mapDbProductToProduct));
      } catch (err) {
        console.error("[BrandAllItems] unexpected error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [brandName]);

  const handleProductClick = (product: Product) => {
    navigate(`/product/${product.product_id}`);
  };

  const handleShopAll = () => {
    navigate(`/marketplace?search=${encodeURIComponent(brandSearchTerm)}&title=${encodeURIComponent(brandName)}`);
  };

  return (
    <section className="px-4 md:px-6 max-w-[1400px] mx-auto mb-16">
      <div className="flex items-baseline gap-3 mb-6">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          All {brandName} Products
        </h2>
        {!isLoading && products.length > 0 && (
          <span className="text-sm text-muted-foreground">
            · {products.length} products
          </span>
        )}
      </div>

      {isLoading ? (
        <ProductSkeleton count={8} viewMode="grid" />
      ) : products.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">
          No cached products found. Search to discover {brandName} items!
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {products.map((product) => (
            <UnifiedProductCard
              key={product.product_id}
              cardType="airbnb"
              product={product}
              onProductClick={() => handleProductClick(product)}
            />
          ))}
        </div>
      )}

      {!isLoading && products.length > 0 && (
        <div className="flex justify-center mt-10">
          <Button
            onClick={handleShopAll}
            variant="outline"
            size="lg"
            className="rounded-full px-8 font-semibold gap-2"
          >
            Shop All {brandName}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </section>
  );
};

export default BrandAllItems;
