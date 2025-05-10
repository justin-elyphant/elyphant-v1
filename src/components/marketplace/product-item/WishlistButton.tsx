import React from "react";
import QuickWishlistButton from "./QuickWishlistButton";

interface WishlistButtonProps {
  productId: string;
  productName: string;
  productImage: string;
  productPrice: number;
  productBrand?: string;
  onClick: (e: React.MouseEvent) => void;
  isFavorited: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "subtle" | "outline";
}

const WishlistButton = ({
  productId,
  productName,
  productImage,
  productPrice,
  productBrand,
  onClick,
  isFavorited,
  size = "md",
  variant = "default",
}: WishlistButtonProps) => {
  // We're now delegating the UI rendering to QuickWishlistButton
  // while keeping this component for backward compatibility and data handling
  return (
    <QuickWishlistButton
      productId={productId}
      isFavorited={isFavorited}
      onClick={onClick}
      size={size}
      variant={variant}
    />
  );
};

export default WishlistButton;
