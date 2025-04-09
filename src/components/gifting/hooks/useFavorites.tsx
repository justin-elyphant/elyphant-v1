
import { useState, useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { Product } from "@/contexts/ProductContext";
import { useProducts } from "@/contexts/ProductContext";
import { toast } from "sonner";

export const useFavorites = () => {
  const [favoritedProducts, setFavoritedProducts] = useLocalStorage<number[]>("favoritedProducts", []);
  const { products } = useProducts();
  const [favoriteItems, setFavoriteItems] = useState<Product[]>([]);
  
  useEffect(() => {
    // Find all favorited products from the main products list
    const items = products.filter(product => favoritedProducts.includes(product.id));
    setFavoriteItems(items);
  }, [favoritedProducts, products]);

  const handleFavoriteToggle = (productId: number) => {
    setFavoritedProducts(prev => {
      const newFavorites = prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId];
      
      if (newFavorites.includes(productId)) {
        toast.success("Added to favorites");
      } else {
        toast.info("Removed from favorites");
      }
      
      return newFavorites;
    });
  };

  const isFavorited = (productId: number): boolean => {
    return favoritedProducts.includes(productId);
  };

  return {
    favoriteItems,
    favoritedProducts,
    handleFavoriteToggle,
    isFavorited
  };
};
