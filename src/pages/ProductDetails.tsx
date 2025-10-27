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

  // Get context and return path from navigation state
  const context = location.state?.context || 'marketplace';
  const returnPath = location.state?.returnPath;

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      if (returnPath) {
        // Navigate back to the exact path with search params
        navigate(returnPath);
      } else if (window.history.length > 1) {
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
        context={context}
      />
    </div>
  );
};

export default ProductDetailsPage;
