
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Gift, ShoppingBag, Calendar, Heart, Cake, Star, Package, Users, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type CategoryType = 
  | "birthday"
  | "holiday"
  | "anniversary"
  | "wedding"
  | "baby"
  | "personal"
  | "shopping"
  | "gift-ideas"
  | "other";

interface WishlistCategoryBadgeProps {
  category: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const WishlistCategoryBadge = ({ 
  category, 
  size = "md", 
  className 
}: WishlistCategoryBadgeProps) => {
  // Normalize the category string to match our types
  const normalizedCategory = category.toLowerCase().replace(/\s+/g, "-") as CategoryType;
  
  // Define colors and icons for each category
  const categoryConfig: Record<CategoryType, {color: string, icon: React.ReactNode}> = {
    "birthday": {
      color: "bg-pink-100 text-pink-800 hover:bg-pink-200 border-pink-200",
      icon: <Cake className="h-3 w-3 mr-1" />
    },
    "holiday": {
      color: "bg-green-100 text-green-800 hover:bg-green-200 border-green-200",
      icon: <Calendar className="h-3 w-3 mr-1" />
    },
    "anniversary": {
      color: "bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200",
      icon: <Heart className="h-3 w-3 mr-1" />
    },
    "wedding": {
      color: "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200",
      icon: <Users className="h-3 w-3 mr-1" />
    },
    "baby": {
      color: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200",
      icon: <Package className="h-3 w-3 mr-1" />
    },
    "personal": {
      color: "bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border-indigo-200",
      icon: <Star className="h-3 w-3 mr-1" />
    },
    "shopping": {
      color: "bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200",
      icon: <ShoppingBag className="h-3 w-3 mr-1" />
    },
    "gift-ideas": {
      color: "bg-cyan-100 text-cyan-800 hover:bg-cyan-200 border-cyan-200",
      icon: <Gift className="h-3 w-3 mr-1" />
    },
    "other": {
      color: "bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200",
      icon: <Sparkles className="h-3 w-3 mr-1" />
    }
  };
  
  // Use default if category not found
  const { color, icon } = categoryConfig[normalizedCategory] || categoryConfig.other;
  
  // Size classes
  const sizeClasses = {
    sm: "text-xs py-0 px-1.5",
    md: "text-xs py-0.5 px-2",
    lg: "text-sm py-1 px-2.5"
  };
  
  const displayName = category
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        color,
        sizeClasses[size],
        "flex items-center font-medium",
        className
      )}
    >
      {icon}
      {displayName}
    </Badge>
  );
};

export default WishlistCategoryBadge;
