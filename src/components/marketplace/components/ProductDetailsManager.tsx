
import React, { useEffect } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { Product } from "@/types/product";

interface ProductDetailsManagerProps {
  products: Product[];
  userData: any;
}

const ProductDetailsManager: React.FC<ProductDetailsManagerProps> = ({ products, userData }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const productId = searchParams.get("productId");
  
  // Redirect ?productId query param to full-page route
  useEffect(() => {
    if (productId) {
      const product = products.find(p => p.product_id === productId);
      
      // Navigate to full-page product details
      navigate(`/marketplace/product/${productId}`, {
        state: { 
          product,
          context: 'marketplace',
          returnPath: location.pathname
        },
        replace: true // Replace history entry to avoid back button confusion
      });
      
      // Clear the productId query param
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("productId");
      setSearchParams(newParams, { replace: true });
    }
  }, [productId, products, navigate, location.pathname, searchParams, setSearchParams]);

  return null; // Component now only handles redirects
};

export default ProductDetailsManager;
