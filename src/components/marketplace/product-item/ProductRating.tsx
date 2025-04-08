
import React from "react";
import SharedProductRating from "@/components/shared/ProductRating";

interface ProductRatingProps {
  rating?: number;
  reviewCount?: number;
  size?: "sm" | "md" | "lg";  // Add size prop to match SharedProductRating
  className?: string;         // Also add className for consistency
}

const ProductRating = ({ rating, reviewCount, size, className }: ProductRatingProps) => {
  return <SharedProductRating 
    rating={rating} 
    reviewCount={reviewCount} 
    size={size}
    className={className}
  />;
};

export default ProductRating;
