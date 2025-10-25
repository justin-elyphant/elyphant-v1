import React from "react";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { WishlistItem } from "@/types/profile";

interface RecentlyAddedSectionProps {
  items: WishlistItem[];
}

const RecentlyAddedSection = ({ items }: RecentlyAddedSectionProps) => {
  if (items.length === 0) return null;

  // Show only the last 5 items
  const recentItems = items.slice(0, 5);

  return (
    <div className="border-b border-border pb-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm">Recently Added to Your Wishlist</h3>
      </div>
      
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {recentItems.map((item) => (
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

export default RecentlyAddedSection;
