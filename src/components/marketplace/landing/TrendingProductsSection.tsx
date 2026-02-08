import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { productCatalogService } from "@/services/ProductCatalogService";
import { CategorySection } from "@/components/marketplace/CategorySection";
import { Product } from "@/types/product";

interface ProductRowConfig {
  title: string;
  subtitle: string;
  query: string;
  seeAllUrl: string;
  delayMs: number;
}

const PRODUCT_ROWS: ProductRowConfig[] = [
  {
    title: "Trending Right Now",
    subtitle: "Popular picks loved by shoppers",
    query: "best selling top rated popular trending",
    seeAllUrl: "/marketplace?search=best+selling&category=best-selling",
    delayMs: 0,
  },
  {
    title: "New Arrivals",
    subtitle: "Fresh finds and latest products",
    query: "new arrivals latest products fresh finds",
    seeAllUrl: "/marketplace?search=new+arrivals",
    delayMs: 300,
  },
  {
    title: "Top Rated",
    subtitle: "Highest rated gifts with rave reviews",
    query: "top rated best reviewed highest rated",
    seeAllUrl: "/marketplace?search=top+rated",
    delayMs: 600,
  },
];

interface TrendingProductsSectionProps {
  onProductClick?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
}

interface RowState {
  products: Product[];
  isLoading: boolean;
}

const TrendingProductsSection: React.FC<TrendingProductsSectionProps> = ({
  onProductClick,
  onAddToCart,
}) => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<RowState[]>(
    PRODUCT_ROWS.map(() => ({ products: [], isLoading: true }))
  );
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    const loadRow = async (index: number, config: ProductRowConfig) => {
      // Progressive delay to avoid API contention
      if (config.delayMs > 0) {
        await new Promise((r) => setTimeout(r, config.delayMs));
      }
      if (cancelledRef.current) return;

      try {
        const response = await productCatalogService.searchProducts(config.query, {
          limit: 8,
        });

        if (cancelledRef.current) return;

        const mapped: Product[] = (response.products || []).map((r: any) => ({
          product_id: r.product_id || r.id,
          title: r.title || r.name,
          price: r.price || 0,
          image: r.image || r.main_image || "/placeholder.svg",
          category: r.category || "general",
          vendor: r.vendor || r.retailer || "Amazon",
          rating: r.rating || r.stars || 0,
          reviewCount: r.reviewCount || r.num_reviews || 0,
          description: r.description || r.product_description || "",
          brand: r.brand || "",
        }));

        setRows((prev) => {
          const next = [...prev];
          next[index] = { products: mapped, isLoading: false };
          return next;
        });
      } catch (err) {
        console.error(`[TrendingProductsSection] Failed to load "${config.title}":`, err);
        if (!cancelledRef.current) {
          setRows((prev) => {
            const next = [...prev];
            next[index] = { products: [], isLoading: false };
            return next;
          });
        }
      }
    };

    PRODUCT_ROWS.forEach((config, index) => loadRow(index, config));

    return () => {
      cancelledRef.current = true;
    };
  }, []);

  return (
    <div className="space-y-10">
      {PRODUCT_ROWS.map((config, index) => (
        <CategorySection
          key={config.title}
          title={config.title}
          subtitle={config.subtitle}
          products={rows[index].products}
          isLoading={rows[index].isLoading}
          onSeeAll={() => navigate(config.seeAllUrl)}
          onProductClick={onProductClick}
          onAddToCart={onAddToCart}
          showSeeAll={rows[index].products.length > 0}
          maxItems={8}
        />
      ))}
    </div>
  );
};

export default TrendingProductsSection;
