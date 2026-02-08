import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CategorySection } from "@/components/marketplace/CategorySection";
import { Product } from "@/types/product";

interface DiscoveryRowConfig {
  title: string;
  subtitle: string;
  seeAllUrl: string;
  delayMs: number;
  queryFn: () => Promise<any[]>;
}

/**
 * Maps a row from the products table to the Product type used by cards.
 * The products table uses `image_url` and stores stars/review_count in metadata JSONB.
 */
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

const createRowConfigs = (): DiscoveryRowConfig[] => [
  {
    title: "Trending Right Now",
    subtitle: "Popular picks loved by shoppers",
    seeAllUrl: "/marketplace?search=best+selling&category=best-selling",
    delayMs: 0,
    queryFn: async () => {
      // Most-viewed products = real user engagement
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .gt("view_count", 0)
        .order("view_count", { ascending: false })
        .limit(8);

      if (error) throw error;

      // If fewer than 8 products have views, backfill with highest purchase_count
      if ((data?.length || 0) < 8) {
        const existingIds = (data || []).map((p: any) => p.product_id);
        const remaining = 8 - (data?.length || 0);
        const { data: backfill } = await supabase
          .from("products")
          .select("*")
          .not("product_id", "in", `(${existingIds.join(",")})`)
          .order("purchase_count", { ascending: false })
          .limit(remaining);
        return [...(data || []), ...(backfill || [])];
      }
      return data || [];
    },
  },
  {
    title: "New Arrivals",
    subtitle: "Fresh finds and latest products",
    seeAllUrl: "/marketplace?search=new+arrivals",
    delayMs: 200,
    queryFn: async () => {
      // Most recently added to the catalog
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data || [];
    },
  },
  {
    title: "Top Rated",
    subtitle: "Highest rated gifts with rave reviews",
    seeAllUrl: "/marketplace?search=top+rated",
    delayMs: 400,
    queryFn: async () => {
      // Products with the most verified reviews, then sort client-side by stars
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .not("metadata->review_count", "is", null)
        .order("view_count", { ascending: false })
        .limit(40); // Fetch extra so we can sort client-side by review quality
      if (error) throw error;

      // Sort by review_count DESC, then stars DESC, take top 8
      const sorted = (data || [])
        .filter((p: any) => {
          const rc = p.metadata?.review_count;
          return rc && Number(rc) > 10;
        })
        .sort((a: any, b: any) => {
          const starsA = Number(a.metadata?.stars || 0);
          const starsB = Number(b.metadata?.stars || 0);
          if (starsB !== starsA) return starsB - starsA;
          return Number(b.metadata?.review_count || 0) - Number(a.metadata?.review_count || 0);
        })
        .slice(0, 8);

      return sorted;
    },
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
  const rowConfigs = useRef(createRowConfigs()).current;
  const [rows, setRows] = useState<RowState[]>(
    rowConfigs.map(() => ({ products: [], isLoading: true }))
  );
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    const loadRow = async (index: number, config: DiscoveryRowConfig) => {
      if (config.delayMs > 0) {
        await new Promise((r) => setTimeout(r, config.delayMs));
      }
      if (cancelledRef.current) return;

      try {
        const rawProducts = await config.queryFn();
        if (cancelledRef.current) return;

        const mapped = rawProducts.map(mapDbProductToProduct);

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

    rowConfigs.forEach((config, index) => loadRow(index, config));

    return () => {
      cancelledRef.current = true;
    };
  }, [rowConfigs]);

  return (
    <div className="space-y-10">
      {rowConfigs.map((config, index) => (
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
