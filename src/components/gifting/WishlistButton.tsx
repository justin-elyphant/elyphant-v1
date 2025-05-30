
import React, { useState } from "react";
import WishlistSelectionPopoverButton from "./wishlist/WishlistSelectionPopoverButton";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import SignUpDialog from "@/components/marketplace/SignUpDialog";

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
  const { user } = useAuth();
  const [showSignUpDialog, setShowSignUpDialog] = useState(false);

  if (!isGifteeView) return null;

  const handleWishlistClick = () => {
    if (!user) {
      setShowSignUpDialog(true);
    }
  };

  return (
    <>
      {user ? (
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
      ) : (
        <Button
          variant="ghost"
          size={isMobile ? "default" : "sm"}
          className="p-2 text-gray-400 hover:text-pink-500"
          onClick={handleWishlistClick}
        >
          <Heart className="h-4 w-4" />
        </Button>
      )}

      <SignUpDialog 
        open={showSignUpDialog} 
        onOpenChange={setShowSignUpDialog} 
      />
    </>
  );
};

export default WishlistButton;
