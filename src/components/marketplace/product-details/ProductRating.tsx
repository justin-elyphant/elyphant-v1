
import React from "react";
import SharedProductRating from "@/components/shared/ProductRating";

interface ProductRatingProps {
  rating?: number;
  reviewCount?: number | string;  // Allow both number and string
}

const ProductRating = ({ rating, reviewCount }: ProductRatingProps) => {
  return <SharedProductRating rating={rating} reviewCount={reviewCount} size="lg" />;
};

export default ProductRating;
