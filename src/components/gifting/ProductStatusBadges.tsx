
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Clock } from "lucide-react";

interface ProductStatusBadgesProps {
  isBestSeller: boolean;
  isNewArrival: boolean;
  isRecentlyViewed: boolean;
}

const ProductStatusBadges: React.FC<ProductStatusBadgesProps> = ({
  isBestSeller,
  isNewArrival,
  isRecentlyViewed,
}) => (
  <div className="absolute top-2 left-2 flex flex-col gap-1">
    {isBestSeller && (
      <Badge variant="secondary" className="bg-amber-500 text-white border-0">
        <Sparkles className="h-3 w-3 mr-1" />
        <span className="text-xs">Bestseller</span>
      </Badge>
    )}
    {isNewArrival && (
      <Badge variant="secondary" className="bg-green-500 text-white border-0">
        <span className="text-xs">New</span>
      </Badge>
    )}
    {isRecentlyViewed && (
      <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
        <Clock className="h-3 w-3 mr-1" />
        <span className="text-xs">Viewed</span>
      </Badge>
    )}
  </div>
);

export default ProductStatusBadges;
