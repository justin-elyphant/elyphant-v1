
import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Clock, Award, Star, TrendingUp, Heart, Eye } from "lucide-react";
import { customerAnalyticsService } from "@/services/analytics/customerAnalyticsService";
import { Product } from "@/types/product";

interface ProductStatusBadgesProps {
  isBestSeller: boolean;
  isNewArrival: boolean;
  isRecentlyViewed: boolean;
  bestSellerType?: 'amazon_choice' | 'best_seller' | 'popular' | 'top_rated' | 'highly_rated' | null;
  badgeText?: string | null;
  product?: Product; // Add product prop for hybrid analytics
}

interface HybridBadgeData {
  isBestSeller: boolean;
  isPopular: boolean;
  isTrending: boolean;
  popularityScore: number;
  badgeText?: string;
}

const ProductStatusBadges: React.FC<ProductStatusBadgesProps> = ({
  isBestSeller,
  isNewArrival,
  isRecentlyViewed,
  bestSellerType,
  badgeText,
  product,
}) => {
  const [hybridData, setHybridData] = useState<HybridBadgeData | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch hybrid analytics data when product prop is provided
  useEffect(() => {
    if (!product) return;

    const fetchHybridData = async () => {
      setLoading(true);
      try {
        const data = await customerAnalyticsService.getHybridBadgeData(product);
        setHybridData(data);
      } catch (error) {
        console.error('Error fetching hybrid badge data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHybridData();
  }, [product]);

  // Use hybrid data if available, otherwise fall back to props
  const effectiveBestSeller = hybridData?.isBestSeller ?? isBestSeller;
  const effectiveBadgeText = hybridData?.badgeText ?? badgeText;
  const getBestSellerBadge = () => {
    if (!effectiveBestSeller) return null;

    const displayText = effectiveBadgeText || 'Best Seller';
    
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

  const getTrendingBadge = () => {
    if (!hybridData?.isTrending) return null;
    
    return (
      <Badge variant="secondary" className="bg-red-500 text-white border-0">
        <TrendingUp className="h-3 w-3 mr-1" />
        <span className="text-xs">Trending</span>
      </Badge>
    );
  };

  const getPopularBadge = () => {
    if (!hybridData?.isPopular || hybridData?.isBestSeller || hybridData?.isTrending) return null;
    
    return (
      <Badge variant="secondary" className="bg-pink-500 text-white border-0">
        <Heart className="h-3 w-3 mr-1" />
        <span className="text-xs">Popular</span>
      </Badge>
    );
  };

  return (
    <>
      {/* Top-left badges: Category identification & Best Seller */}
      <div className="absolute top-2 left-2 flex flex-col gap-1 items-start z-20">
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
      
      {/* Bottom-left badges: Trending & Popular (avoid heart icon conflict) */}
      <div className="absolute bottom-3 left-2 flex flex-col gap-1 items-start z-20">
        {getTrendingBadge()}
        {getPopularBadge()}
      </div>
    </>
  );
};

export default ProductStatusBadges;
