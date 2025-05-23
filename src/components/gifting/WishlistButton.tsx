
import React from "react";
import WishlistSelectionPopoverButton from "./wishlist/WishlistSelectionPopoverButton";

interface WishlistButtonProps {
  productId: string;
  productName: string;
  productImage: string;
  productPrice: number;
  productBrand?: string;
  isGifteeView: boolean;
  isMobile: boolean;
}

const WishlistButton: React.FC<WishlistButtonProps> = ({
  productId,
  productName,
  productImage,
  productPrice,
  productBrand,
  isGifteeView,
  isMobile,
}) => {
  if (!isGifteeView) return null;
  return (
    <WishlistSelectionPopoverButton
      product={{
        id: productId,
        name: productName,
        image: productImage,
        price: productPrice,
        brand: productBrand,
      }}
      triggerClassName={isMobile ? "p-2" : ""}
    />
  );
};

export default WishlistButton;

