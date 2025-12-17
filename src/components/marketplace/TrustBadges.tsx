
import React, { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Award, Flame, CheckCircle, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Product } from "@/types/product";

interface TrustBadgesProps {
  product: Product;
  size?: "sm" | "md";
  className?: string;
  maxBadges?: number;
}

/**
 * Formats a number into a compact display format
 * e.g., 1500 -> "1.5K", 25000 -> "25K"
 */
const formatCompactNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return String(num);
};

/**
 * Calculate purchase indicator text based on REAL Zinc num_sales data
 * Falls back to view_count for products without sales data
 */
const getPurchaseIndicator = (product: Product): string | null => {
  // Use REAL num_sales from Zinc API (not simulated)
  const numSales = (product as any).num_sales || 
                   (product as any).metadata?.num_sales || 0;
  
  // Display real sales data when available
  if (numSales >= 10000) {
    return `${formatCompactNumber(numSales)}+ bought`;
  }
  if (numSales >= 1000) {
    return `${formatCompactNumber(numSales)}+ bought recently`;
  }
  if (numSales >= 100) {
    return "Popular choice";
  }
  
  // Fallback: Only show for high-engagement cached products without num_sales
  const viewCount = (product as any).view_count || 0;
  if (viewCount > 50) {
    return "Popular choice";
  }
  
  return null;
};

const TrustBadges: React.FC<TrustBadgesProps> = memo(({
  product,
  size = "sm",
  className,
  maxBadges = 1 // Default to 1 for cleaner display
}) => {
  const badges: Array<{
    type: string;
    label: string;
    icon: React.ReactNode;
    priority: number; // Higher = more important
    variant: "amazon_choice" | "best_seller" | "popular" | "trending" | "verified";
  }> = [];

  // Build badges with priority (higher = more important)
  // Amazon's Choice - Priority 4 (highest)
  if ((product as any).bestSellerType === 'amazon_choice' || 
      (product as any).badgeText?.toLowerCase().includes('choice')) {
    badges.push({
      type: 'amazon_choice',
      label: "Amazon's Choice",
      icon: <Award className={cn(size === "sm" ? "w-3 h-3" : "w-4 h-4")} />,
      priority: 4,
      variant: 'amazon_choice'
    });
  }

  // Best Seller - Priority 3
  if ((product as any).isBestSeller || 
      (product as any).bestSellerType === 'best_seller' ||
      (product as any).badgeText?.toLowerCase().includes('best seller')) {
    badges.push({
      type: 'best_seller',
      label: "Best Seller",
      icon: <Flame className={cn(size === "sm" ? "w-3 h-3" : "w-4 h-4")} />,
      priority: 3,
      variant: 'best_seller'
    });
  }

  // Top Rated - Priority 2
  const rating = product.stars || product.rating || (product as any).metadata?.stars || 0;
  if (rating >= 4.5) {
    badges.push({
      type: 'top_rated',
      label: "Top Rated",
      icon: <Star className={cn(size === "sm" ? "w-3 h-3" : "w-4 h-4")} />,
      priority: 2,
      variant: 'verified'
    });
  }

  // Popular - Priority 1 (lowest, skip if we have higher priority badges)
  const viewCount = (product as any).view_count || 0;
  const popularityScore = (product as any).popularity_score || 0;
  const hasBestSellerBadge = badges.some(b => b.type === 'best_seller' || b.type === 'amazon_choice');
  
  if ((popularityScore > 80 || viewCount > 30) && !hasBestSellerBadge) {
    badges.push({
      type: 'popular',
      label: "Popular",
      icon: <TrendingUp className={cn(size === "sm" ? "w-3 h-3" : "w-4 h-4")} />,
      priority: 1,
      variant: 'popular'
    });
  }

  // Sort by priority (highest first) and take only maxBadges
  const sortedBadges = badges.sort((a, b) => b.priority - a.priority).slice(0, maxBadges);

  // Get purchase indicator
  const purchaseIndicator = getPurchaseIndicator(product);

  // Don't render if no badges
  if (badges.length === 0 && !purchaseIndicator) {
    return null;
  }

  const getVariantStyles = (variant: string) => {
    switch (variant) {
      case 'amazon_choice':
        return "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800";
      case 'best_seller':
        return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800";
      case 'popular':
        return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800";
      case 'trending':
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800";
      case 'verified':
        return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {/* Trust Badges - only show sorted highest priority badges */}
      {sortedBadges.map((badge) => (
        <Badge
          key={badge.type}
          variant="outline"
          className={cn(
            "flex items-center gap-1 font-medium border",
            size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1",
            getVariantStyles(badge.variant)
          )}
        >
          {badge.icon}
          {badge.label}
        </Badge>
      ))}

      {/* Purchase Indicator */}
      {purchaseIndicator && (
        <span className={cn(
          "text-muted-foreground flex items-center gap-1",
          size === "sm" ? "text-xs" : "text-sm"
        )}>
          <CheckCircle className={cn(size === "sm" ? "w-3 h-3" : "w-4 h-4", "text-green-500")} />
          {purchaseIndicator}
        </span>
      )}
    </div>
  );
});

TrustBadges.displayName = 'TrustBadges';

export default TrustBadges;
