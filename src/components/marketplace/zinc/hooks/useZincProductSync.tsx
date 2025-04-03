
import { useState } from "react";
import { ZincProduct } from "../types";

/**
 * Hook for syncing products from Zinc API
 */
export const useZincProductSync = (updateLastSync: () => void) => {
  const [error, setError] = useState<string | null>(null);
  
  const syncProducts = async (): Promise<ZincProduct[]> => {
    try {
      // In a real implementation, this would call the Zinc API
      // and sync products from the Zinc platform to our application
      console.log("Syncing products from Zinc API...");
      
      // Enhanced mock implementation with better image arrays
      const mockProducts: ZincProduct[] = [
        {
          product_id: "ZINC1",
          title: "Premium Wireless Headphones",
          price: 129.99,
          description: "High-quality wireless headphones with noise cancellation",
          image: "https://m.media-amazon.com/images/I/71+3+8VcGFL._AC_SL1500_.jpg",
          images: [
            "https://m.media-amazon.com/images/I/71+3+8VcGFL._AC_SL1500_.jpg",
            "https://m.media-amazon.com/images/I/71NTi82uBEL._AC_SL1500_.jpg",
            "https://m.media-amazon.com/images/I/61i8Vjb17SL._SL1500_.jpg"
          ],
          category: "Electronics",
          retailer: "Amazon via Zinc",
          rating: 4.7,
          review_count: 2453
        },
        {
          product_id: "ZINC2",
          title: "Fitness Tracker Pro",
          price: 89.99,
          description: "Advanced fitness tracker with heart rate monitoring",
          image: "https://m.media-amazon.com/images/I/61vjUCzQCaL._SL1500_.jpg",
          images: [
            "https://m.media-amazon.com/images/I/61vjUCzQCaL._SL1500_.jpg",
            "https://m.media-amazon.com/images/I/61a2y1FCAJL._AC_SL1500_.jpg",
            "https://m.media-amazon.com/images/I/61bK6PMOC3L._AC_SL1500_.jpg"
          ],
          category: "Electronics",
          retailer: "Amazon via Zinc",
          rating: 4.5,
          review_count: 1872
        },
        {
          product_id: "ZINC3",
          title: "Organic Cotton T-Shirt",
          price: 24.99,
          description: "Soft, comfortable organic cotton t-shirt",
          image: "https://m.media-amazon.com/images/I/81YpuRoACeL._AC_SL1500_.jpg",
          images: [
            "https://m.media-amazon.com/images/I/81YpuRoACeL._AC_SL1500_.jpg",
            "https://m.media-amazon.com/images/I/716QOWr4QFL._AC_SL1500_.jpg",
            "https://m.media-amazon.com/images/I/61+WYAjltpL._AC_SL1500_.jpg"
          ],
          category: "Clothing",
          retailer: "Amazon via Zinc",
          rating: 4.3,
          review_count: 954
        }
      ];
      
      // Log mock products with their image arrays
      mockProducts.forEach(product => {
        console.log(`Mock product: ${product.title}, images:`, product.images);
      });
      
      // Update last sync time
      updateLastSync();
      
      return mockProducts;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to sync products";
      setError(errorMessage);
      return [];
    }
  };

  return {
    syncProducts,
    error
  };
};
