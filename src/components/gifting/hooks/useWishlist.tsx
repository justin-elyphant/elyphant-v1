
import { useState } from "react";
import { useLocalStorage } from "./useLocalStorage";

export const useWishlist = () => {
  const [wishlistedProducts, setWishlistedProducts] = useLocalStorage<string[]>("wishlisted-products", []);
  
  const handleWishlistToggle = (productId: string) => {
    if (!productId) return;
    
    setWishlistedProducts(prev => {
      const isWishlisted = prev.includes(productId);
      
      if (isWishlisted) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  return {
    wishlistedProducts,
    handleWishlistToggle
  };
};
