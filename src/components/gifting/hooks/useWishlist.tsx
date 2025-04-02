
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const useWishlist = () => {
  const [wishlistedProducts, setWishlistedProducts] = useState<number[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('wishlistedProducts');
    if (saved) {
      try {
        setWishlistedProducts(JSON.parse(saved));
      } catch (e) {
        console.error("Error parsing saved wishlisted products:", e);
      }
    }
  }, []);

  const handleWishlistToggle = (productId: number) => {
    setWishlistedProducts(prev => {
      const newWishlisted = prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId];
      
      localStorage.setItem('wishlistedProducts', JSON.stringify(newWishlisted));
      
      if (newWishlisted.includes(productId)) {
        toast.success("Added to wishlist");
      } else {
        toast.info("Removed from wishlist");
      }
      
      return newWishlisted;
    });
  };

  return {
    wishlistedProducts,
    handleWishlistToggle
  };
};
