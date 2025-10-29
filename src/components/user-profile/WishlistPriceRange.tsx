import React from "react";
import { Badge } from "@/components/ui/badge";
import { DollarSign } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface WishlistPriceRangeProps {
  items: Array<{ price?: number }>;
}

/**
 * Displays price range summary for wishlist items
 * Helps gift shoppers understand budget expectations
 */
const WishlistPriceRange: React.FC<WishlistPriceRangeProps> = ({ items }) => {
  if (!items || items.length === 0) return null;

  const prices = items
    .map(item => item.price || 0)
    .filter(price => price > 0);

  if (prices.length === 0) return null;

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;

  return (
    <div className="flex items-center gap-2 text-sm">
      <DollarSign className="h-4 w-4 text-green-600" />
      <span className="text-muted-foreground">Price range:</span>
      <Badge variant="secondary" className="bg-green-100 text-green-700">
        {formatPrice(minPrice)} - {formatPrice(maxPrice)}
      </Badge>
      <span className="text-muted-foreground text-xs">
        (avg {formatPrice(avgPrice)})
      </span>
    </div>
  );
};

export default WishlistPriceRange;
