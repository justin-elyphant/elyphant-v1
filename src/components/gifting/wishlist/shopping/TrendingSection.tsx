import React from "react";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";
import { WishlistItem } from "@/types/profile";

interface TrendingSectionProps {
  items: WishlistItem[];
}

const TrendingSection = ({ items }: TrendingSectionProps) => {
  if (items.length === 0) return null;

  // Show only the first 6 items
  const trendingItems = items.slice(0, 6);

  return (
    <div className="border-b border-border pb-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm">Trending on Amazon</h3>
      </div>
      
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {trendingItems.map((item) => (
          <div 
            key={item.id} 
            className="flex-shrink-0 w-24 group"
          >
            <div className="aspect-square bg-muted rounded-lg overflow-hidden mb-2">
              <img
                src={item.image_url || "/placeholder.svg"}
                alt={item.name || item.title || "Product"}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <p className="text-xs font-medium line-clamp-2 leading-tight">
              {item.name || item.title}
            </p>
            <p className="text-xs text-primary font-bold mt-1">
              ${item.price?.toFixed(2) || "0.00"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrendingSection;
