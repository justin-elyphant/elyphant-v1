
import React from "react";
import NewProductDetailsDialog from "./product-details/ProductDetailsDialog";
import { Product } from "@/types/product";

interface WrapperProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userData: any;
  onWishlistChange?: () => void;
}

// Wrapper to unify all ProductDetailsDialog imports
// Redirects legacy marketplace dialog to the enhanced dialog with variations
const ProductDetailsDialog: React.FC<WrapperProps> = ({
  product,
  open,
  onOpenChange,
  userData,
  onWishlistChange,
}) => {
  return (
    <NewProductDetailsDialog
      product={product as any}
      open={open}
      onOpenChange={onOpenChange}
      userData={userData}
      onWishlistChange={onWishlistChange}
    />
  );
};

export default ProductDetailsDialog;

