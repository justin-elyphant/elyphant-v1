
import React from "react";
import SharedProductRating from "@/components/shared/ProductRating";

interface ProductRatingProps {
  rating?: number;
  reviewCount?: number | string;  // Allow both number and string
  size?: "sm" | "md" | "lg";  
  className?: string;         
}

const ProductRating = ({ rating, reviewCount, size = "md", className }: ProductRatingProps) => {
  return <SharedProductRating 
    rating={rating} 
    reviewCount={reviewCount} 
    size={size}
    className={className}
    showParentheses={true}
  />;
};

export default ProductRating;
