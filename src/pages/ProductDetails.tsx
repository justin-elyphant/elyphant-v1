import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import ProductDetailsDialog from "@/components/marketplace/product-details/ProductDetailsDialog";
import { useAuth } from "@/contexts/auth";

const ProductDetailsPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

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
        open={true}
        onOpenChange={handleOpenChange}
        userData={user}
      />
    </div>
  );
};

export default ProductDetailsPage;
