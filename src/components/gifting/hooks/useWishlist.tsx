
import { toast } from "sonner";
import { useLocalStorage } from "./useLocalStorage";

export const useWishlist = () => {
  const [wishlistedProducts, setWishlistedProducts] = useLocalStorage<number[]>('wishlistedProducts', []);

  const handleWishlistToggle = (productId: number) => {
    setWishlistedProducts(prev => {
      const newWishlisted = prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId];
      
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
