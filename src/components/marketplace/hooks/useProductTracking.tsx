
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { Product } from "@/types/product";
import { useSearchParams } from "react-router-dom";
import { useEffect } from "react";

export const useProductTracking = (products: Product[]) => {
  const { addToRecentlyViewed } = useRecentlyViewed();
  const [searchParams] = useSearchParams();
  
  // Track product view when opened via URL parameter
  useEffect(() => {
    const productId = searchParams.get("productId");
    if (productId) {
      trackProductView(productId);
    }
  }, [searchParams]);
  
  const trackProductView = (productId: string) => {
    // Find the product in the current products list
    const product = products.find(p => (p.product_id || p.id) === productId);
    if (product) {
      addToRecentlyViewed({
        id: product.product_id || product.id || "",
        name: product.title || product.name || "",
        image: product.image || "",
        price: product.price
      });
    }
  };

  return { trackProductView };
};
