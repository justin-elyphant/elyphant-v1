
import { useEffect, useState } from "react";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { Product } from "@/types/product";
import { useSearchParams } from "react-router-dom";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { useProductDataSync } from "@/hooks/useProductDataSync";

/**
 * Hook for tracking product views in the marketplace
 */
export const useProductTracking = (products: Product[]) => {
  const { addItem } = useRecentlyViewed();
  const { trackProductView } = useProductDataSync();
  const [searchParams] = useSearchParams();
  const { profile } = useProfile();
  const [lastTrackedId, setLastTrackedId] = useState<string | null>(null);
  
  // Track product view when opened via URL parameter
  useEffect(() => {
    const productId = searchParams.get("productId");
    if (productId && productId !== lastTrackedId) {
      trackProductViewById(productId);
      setLastTrackedId(productId);
    }
  }, [searchParams, products]);
  
  // Track a product view by ID
  const trackProductViewById = (productId: string) => {
    console.log("Tracking product view by ID:", productId);
    
    // Find the product in the current products list
    const product = products.find(p => (p.product_id || p.id) === productId);
    if (product) {
      console.log("Found product to track:", product.title || product.name);
      
      // Add to recently viewed in local storage
      addItem({
        id: product.product_id || product.id || "",
        title: product.title || product.name || "",
        image: product.image || "",
        price: product.price
      });
      
      // Use the new centralized tracking mechanism
      trackProductView(product);
    } else {
      console.warn(`Product with ID ${productId} not found in current products list`);
    }
  };
  
  // Track a product view directly from product object
  const trackProductObject = (product: Product) => {
    if (!product) return;
    
    const productId = product.product_id || product.id;
    if (!productId) {
      console.warn("Cannot track product without ID");
      return;
    }
    
    // Add to recently viewed in local storage
    addItem({
      id: productId,
      title: product.title || product.name || "",
      image: product.image || "",
      price: product.price
    });
    
    // Use the new centralized tracking mechanism
    trackProductView(product);
  };

  return { 
    trackProductView: trackProductObject,
    trackProductViewById
  };
};
