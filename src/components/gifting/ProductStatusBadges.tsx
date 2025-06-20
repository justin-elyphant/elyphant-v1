
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Clock, Award, Star, TrendingUp } from "lucide-react";

interface ProductStatusBadgesProps {
  isBestSeller: boolean;
  isNewArrival: boolean;
  isRecentlyViewed: boolean;
  bestSellerType?: 'amazon_choice' | 'best_seller' | 'popular' | 'top_rated' | 'highly_rated' | null;
  badgeText?: string | null;
}

const ProductStatusBadges: React.FC<ProductStatusBadgesProps> = ({
  isBestSeller,
  isNewArrival,
  isRecentlyViewed,
  bestSellerType,
  badgeText,
}) => {
  const getBestSellerBadge = () => {
    if (!isBestSeller) return null;

    const displayText = badgeText || 'Best Seller';
    
    switch (bestSellerType) {
      case 'amazon_choice':
        return (
          <Badge variant="secondary" className="bg-orange-500 text-white border-0">
            <Award className="h-3 w-3 mr-1" />
            <span className="text-xs">{displayText}</span>
          </Badge>
        );
      case 'best_seller':
        return (
          <Badge variant="secondary" className="bg-amber-500 text-white border-0">
            <Sparkles className="h-3 w-3 mr-1" />
            <span className="text-xs">{displayText}</span>
          </Badge>
        );
      case 'top_rated':
        return (
          <Badge variant="secondary" className="bg-blue-500 text-white border-0">
            <Star className="h-3 w-3 mr-1" />
            <span className="text-xs">{displayText}</span>
          </Badge>
        );
      case 'highly_rated':
        return (
          <Badge variant="secondary" className="bg-purple-500 text-white border-0">
            <Star className="h-3 w-3 mr-1" />
            <span className="text-xs">{displayText}</span>
          </Badge>
        );
      case 'popular':
        return (
          <Badge variant="secondary" className="bg-green-500 text-white border-0">
            <TrendingUp className="h-3 w-3 mr-1" />
            <span className="text-xs">{displayText}</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-amber-500 text-white border-0">
            <Sparkles className="h-3 w-3 mr-1" />
            <span className="text-xs">{displayText}</span>
          </Badge>
        );
    }
  };

  return (
    <div className="absolute top-2 left-2 flex flex-col gap-1">
      {getBestSellerBadge()}
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
};

export default ProductStatusBadges;
