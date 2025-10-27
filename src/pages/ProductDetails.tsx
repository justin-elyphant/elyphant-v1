import React from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import ProductDetailsDialog from "@/components/marketplace/product-details/ProductDetailsDialog";
import { useAuth } from "@/contexts/auth";

const ProductDetailsPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Get product from navigation state if available
  const product = location.state?.product || null;

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate("/marketplace");
      }
    }
  };

  if (!id) return null;

  return (
    <div>
      <ProductDetailsDialog
        productId={id}
        product={product}
        open={true}
        onOpenChange={handleOpenChange}
        userData={user}
      />
    </div>
  );
};

export default ProductDetailsPage;
