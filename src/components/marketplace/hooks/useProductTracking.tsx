
import { useCallback, useEffect } from "react";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { Product } from "@/types/product";

export const useProductTracking = (availableProducts: Product[] = []) => {
  const { addToRecentlyViewed } = useRecentlyViewed();
  
  // Track a product view with full product data
  const trackProductView = useCallback((productId: string) => {
    if (!productId) {
      console.warn("Cannot track product view: No product ID provided");
      return;
    }
    
    // Find the full product data from our available products
    const productInfo = availableProducts.find(
      p => String(p.product_id) === String(productId) || String(p.id) === String(productId)
    );
    
    if (productInfo) {
      console.log("Product tracked:", productInfo.title || productInfo.name);
      
      addToRecentlyViewed({
        id: productId,
        name: productInfo.title || productInfo.name || "Product",
        image: productInfo.image,
        price: typeof productInfo.price === 'number' ? productInfo.price : undefined
      });
    } else {
      console.warn(`Product with ID ${productId} not found in available products`);
      // Add minimal record even if we don't have full product details
      addToRecentlyViewed({
        id: productId,
        name: "Product",
      });
    }
  }, [availableProducts, addToRecentlyViewed]);

  return {
    trackProductView
  };
};
