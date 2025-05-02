
import { useState, useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { Product } from "@/types/product";
import { useProducts } from "@/contexts/ProductContext";
import { toast } from "sonner";

export type SavedItemType = "later" | "wishlist";

interface SavedItem {
  productId: string;
  saveType: SavedItemType;
}

export const useFavorites = () => {
  const [savedItems, setSavedItems] = useLocalStorage<SavedItem[]>("savedItems", []);
  const { products, isLoading } = useProducts();
  const [favoriteItems, setFavoriteItems] = useState<Product[]>([]);
  
  useEffect(() => {
    if (!products || isLoading) {
      return; // Don't process if products aren't loaded yet
    }
    
    // Find all saved products from the main products list
    const productIds = savedItems.map(item => item.productId);
    const items = products.filter(product => product.product_id && productIds.includes(product.product_id));
    setFavoriteItems(items);
  }, [savedItems, products, isLoading]);

  const handleFavoriteToggle = (productId: string) => {
    setSavedItems(prev => {
      const itemExists = prev.some(item => item.productId === productId);
      
      if (itemExists) {
        // Remove item if it exists
        const newItems = prev.filter(item => item.productId !== productId);
        toast.info("Removed from saved items");
        return newItems;
      } else {
        // Add item with default save type "later"
        toast.success("Saved for later");
        return [...prev, { productId, saveType: "later" }];
      }
    });
  };

  const handleSaveOptionSelect = (saveType: SavedItemType, productId: string) => {
    setSavedItems(prev => {
      const existingItemIndex = prev.findIndex(item => item.productId === productId);
      
      if (existingItemIndex >= 0) {
        // Update existing item
        const newItems = [...prev];
        newItems[existingItemIndex] = { ...newItems[existingItemIndex], saveType };
        
        toast.success(saveType === "wishlist" 
          ? "Added to your wishlist" 
          : "Saved for later"
        );
        
        return newItems;
      } else {
        // Add new item with specified save type
        toast.success(saveType === "wishlist" 
          ? "Added to your wishlist" 
          : "Saved for later"
        );
        
        return [...prev, { productId, saveType }];
      }
    });
  };

  const isFavorited = (productId: string): boolean => {
    return savedItems.some(item => item.productId === productId);
  };

  const getSaveType = (productId: string): SavedItemType | null => {
    const item = savedItems.find(item => item.productId === productId);
    return item ? item.saveType : null;
  };

  // Get items filtered by save type
  const getItemsBySaveType = (saveType: SavedItemType): Product[] => {
    if (!products || isLoading) {
      return []; // Return empty array if products aren't loaded yet
    }
    
    const filteredIds = savedItems
      .filter(item => item.saveType === saveType)
      .map(item => item.productId);
    
    return products.filter(product => product.product_id && filteredIds.includes(product.product_id));
  };

  return {
    favoriteItems,
    savedItems,
    handleFavoriteToggle,
    handleSaveOptionSelect,
    isFavorited,
    getSaveType,
    getItemsBySaveType,
    wishlistItems: getItemsBySaveType("wishlist"),
    laterItems: getItemsBySaveType("later"),
    isLoading // Export loading state for components to use
  };
};
