
import { useState, useEffect } from "react";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { Product } from "@/types/product";
import { useProducts } from "@/contexts/ProductContext";

export const useRecentlyViewedProducts = () => {
  const { recentlyViewed, addToRecentlyViewed } = useRecentlyViewed();
  const { products } = useProducts();
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);

  // Transform recently viewed items to full product objects
  useEffect(() => {
    if (!recentlyViewed || !products) return;

    // Match recently viewed items with full product objects from context
    const fullProducts = recentlyViewed
      .map(item => {
        // Find the matching product in our products context
        const matchedProduct = products.find(
          p => String(p.product_id) === String(item.id) || String(p.id) === String(item.id)
        );
        
        if (matchedProduct) return matchedProduct;
        
        // If no match, create a minimal product from the recently viewed data
        return {
          product_id: item.id,
          id: item.id,
          title: item.name,
          image: item.image || "/placeholder.svg",
          price: item.price || 0,
          _timestamp: item.viewedAt
        };
      })
      .filter(Boolean);

    setRecentProducts(fullProducts);
  }, [recentlyViewed, products]);

  // Track a product view
  const trackProductView = (productId: string, productData?: Partial<Product>) => {
    // Find the product info in our products context
    const productInfo = products.find(
      p => String(p.product_id) === String(productId) || String(p.id) === String(productId)
    );
    
    if (productInfo || productData) {
      const product = productInfo || productData;
      console.log("Tracking product view:", productId, product?.title || product?.name);
      
      addToRecentlyViewed({
        id: productId,
        name: product?.title || product?.name || "Product",
        image: product?.image,
        price: typeof product?.price === 'number' ? product.price : undefined
      });
    } else {
      console.warn("Could not find product info for tracking:", productId);
    }
  };

  return {
    recentProducts,
    trackProductView
  };
};
