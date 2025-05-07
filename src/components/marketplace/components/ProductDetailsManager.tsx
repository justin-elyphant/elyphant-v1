
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductDetailsDialog from "../product-details/ProductDetailsDialog";
import { Product } from "@/types/product";
import SignUpDialog from "../SignUpDialog";

interface ProductDetailsManagerProps {
  products: Product[];
  userData: any;
}

const ProductDetailsManager: React.FC<ProductDetailsManagerProps> = ({ products, userData }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const productId = searchParams.get("productId");
  const [showProductDetails, setShowProductDetails] = useState<string | null>(productId);
  const [showSignUpDialog, setShowSignUpDialog] = useState(false);
  
  useEffect(() => {
    if (productId) {
      setShowProductDetails(productId);
    } else {
      setShowProductDetails(null);
    }
  }, [productId]);

  const selectedProduct = showProductDetails !== null 
    ? products.find(p => p.product_id === showProductDetails)
    : null;

  return (
    <>
      {/* Sign Up Dialog for non-authenticated interactions */}
      <SignUpDialog 
        open={showSignUpDialog}
        onOpenChange={setShowSignUpDialog} 
      />
      
      {/* Product Details Dialog */}
      <ProductDetailsDialog 
        productId={selectedProduct?.product_id || null}
        open={showProductDetails !== null}
        onOpenChange={(open) => {
          if (!open) {
            const newParams = new URLSearchParams(searchParams);
            newParams.delete("productId");
            setSearchParams(newParams);
          }
        }}
        userData={userData}
      />
    </>
  );
};

export default ProductDetailsManager;
