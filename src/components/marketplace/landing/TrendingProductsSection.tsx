import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { productCatalogService } from "@/services/ProductCatalogService";
import { CategorySection } from "@/components/marketplace/CategorySection";
import { Product } from "@/types/product";

interface TrendingProductsSectionProps {
  onProductClick?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
}

const TrendingProductsSection: React.FC<TrendingProductsSectionProps> = ({
  onProductClick,
  onAddToCart,
}) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadTrending = async () => {
      try {
        const response = await productCatalogService.searchProducts(
          "best selling top rated popular trending",
          { limit: 8 }
        );

        if (cancelled) return;

        const mapped: Product[] = (response.products || []).map((r: any) => ({
          product_id: r.product_id || r.id,
          title: r.title || r.name,
          price: r.price || 0,
          image: r.image || r.main_image || "/placeholder.svg",
          category: r.category || "best-selling",
          vendor: r.vendor || r.retailer || "Amazon",
          rating: r.rating || r.stars || 0,
          reviewCount: r.reviewCount || r.num_reviews || 0,
          description: r.description || r.product_description || "",
          brand: r.brand || "",
        }));

        setProducts(mapped);
      } catch (err) {
        console.error("[TrendingProductsSection] Failed to load:", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadTrending();
    return () => { cancelled = true; };
  }, []);

  const handleSeeAll = () => {
    navigate("/marketplace?search=best+selling&category=best-selling");
  };

  return (
    <div className="mb-12">
      <CategorySection
        title="Trending Right Now"
        subtitle="Popular picks loved by shoppers"
        products={products}
        isLoading={isLoading}
        onSeeAll={handleSeeAll}
        onProductClick={onProductClick}
        onAddToCart={onAddToCart}
        showSeeAll={products.length > 0}
        maxItems={8}
      />
    </div>
  );
};

export default TrendingProductsSection;
