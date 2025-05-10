
import React from "react";
import { Badge, BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Predefined category colors
const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  birthday: { 
    bg: "bg-blue-50", 
    text: "text-blue-700", 
    border: "border-blue-200" 
  },
  holiday: { 
    bg: "bg-green-50", 
    text: "text-green-700", 
    border: "border-green-200" 
  },
  wedding: { 
    bg: "bg-purple-50", 
    text: "text-purple-700", 
    border: "border-purple-200" 
  },
  baby: { 
    bg: "bg-pink-50", 
    text: "text-pink-700", 
    border: "border-pink-200" 
  },
  other: { 
    bg: "bg-gray-50", 
    text: "text-gray-700", 
    border: "border-gray-200" 
  },
  // Default used when category doesn't match predefined ones
  default: { 
    bg: "bg-gray-50", 
    text: "text-gray-700", 
    border: "border-gray-200" 
  }
};

interface WishlistCategoryBadgeProps extends BadgeProps {
  category: string;
  size?: "sm" | "default";
}

const WishlistCategoryBadge = ({ 
  category, 
  className, 
  size = "default",
  ...props 
}: WishlistCategoryBadgeProps) => {
  // Get color scheme for category (or use default)
  const colors = CATEGORY_COLORS[category.toLowerCase()] || CATEGORY_COLORS.default;
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "font-medium capitalize", 
        size === "sm" ? "px-1.5 py-0 text-[10px]" : "px-2 py-0.5 text-xs",
        colors.bg, 
        colors.text, 
        colors.border,
        className
      )} 
      {...props}
    >
      {category}
    </Badge>
  );
};

export default WishlistCategoryBadge;
