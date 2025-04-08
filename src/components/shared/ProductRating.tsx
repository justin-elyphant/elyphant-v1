
import React from "react";
import { Star, StarHalf } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductRatingProps {
  rating?: number;
  reviewCount?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const ProductRating = ({ 
  rating, 
  reviewCount, 
  size = "md", 
  className 
}: ProductRatingProps) => {
  if (!rating) return null;
  
  // Calculate full and half stars
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  // Determine star size based on the size prop
  const starSize = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }[size];
  
  // Define custom brand color for stars
  const starColor = "text-purple-600"; // Using your brand's purple color
  const starFill = "fill-purple-600";
  
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className={`flex ${starColor}`}>
        {[...Array(fullStars)].map((_, i) => (
          <Star key={i} className={`${starSize} ${starFill} ${starColor}`} />
        ))}
        {hasHalfStar && <StarHalf className={`${starSize} ${starFill} ${starColor}`} />}
      </div>
      <span className={`${size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm"} text-muted-foreground`}>
        {rating.toFixed(1)}
        {reviewCount && ` (${reviewCount.toLocaleString()})`}
      </span>
    </div>
  );
};

export default ProductRating;
