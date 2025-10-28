import React from "react";
import { TrendingUp } from "lucide-react";
import { WishlistItem } from "@/types/profile";
import { Product } from "@/types/product";
import AirbnbStyleProductCard from "@/components/marketplace/AirbnbStyleProductCard";

interface TrendingSectionProps {
  items: WishlistItem[];
  onQuickAdd?: (product: Product) => void;
  onProductClick?: (product: Product) => void;
}

const TrendingSection = ({ items, onQuickAdd, onProductClick }: TrendingSectionProps) => {
  if (items.length === 0) return null;

  // Show only the first 6 items
  const trendingItems = items.slice(0, 6);

  // Transform WishlistItem to Product format
  const transformToProduct = (item: WishlistItem): Product => ({
    id: item.id,
    product_id: item.product_id || item.id,
    title: item.name || item.title || "Product",
    name: item.name || item.title || "Product",
    price: item.price || 0,
    image: item.image_url || "/placeholder.svg",
    images: [item.image_url || "/placeholder.svg"],
    brand: item.brand || "Amazon",
    rating: 0,
    reviewCount: 0,
  });

  return (
    <div className="border-b border-border pb-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm">Trending on Amazon</h3>
      </div>
      
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin snap-x snap-mandatory">
        {trendingItems.map((item) => {
          const product = transformToProduct(item);
          return (
            <div key={item.id} className="flex-shrink-0 w-36 snap-start">
              <AirbnbStyleProductCard
                product={product}
                onProductClick={() => {
                  onProductClick?.(product);
                }}
                context="wishlist"
                viewMode="grid"
                onAddToCart={onQuickAdd}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TrendingSection;
