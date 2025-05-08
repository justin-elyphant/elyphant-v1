
import { useMemo } from "react";
import { Product } from "@/contexts/ProductContext";
import { sortProducts } from "../../hooks/utils/categoryUtils";

export const useProductDisplay = (products: Product[], sortOption: string) => {
  // Memoize sorted products to prevent unnecessary recalculations
  const sortedProducts = useMemo(() => {
    return sortProducts(products, sortOption);
  }, [products, sortOption]);
  
  // Group products by source for better display
  const groupedProducts = useMemo(() => {
    const wishlistItems = sortedProducts.filter(p => p.fromWishlist);
    const preferenceItems = sortedProducts.filter(p => p.fromPreferences && !p.fromWishlist);
    const regularItems = sortedProducts.filter(p => !p.fromWishlist && !p.fromPreferences);
    
    return {
      wishlistItems,
      preferenceItems,
      regularItems,
      hasGrouping: wishlistItems.length > 0 || preferenceItems.length > 0
    };
  }, [sortedProducts]);

  return {
    sortedProducts,
    groupedProducts
  };
};
