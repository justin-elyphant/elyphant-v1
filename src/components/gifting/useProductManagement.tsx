
import { Product } from "@/contexts/ProductContext";
import { useProductLoader } from "./hooks/useProductLoader";
import { useProductFilter } from "./hooks/useProductFilter";
import { useWishlist } from "./hooks/useWishlist";

export const useProductManagement = (initialProducts: Product[] = []) => {
  const { products, isLoading } = useProductLoader(initialProducts);
  
  const {
    filteredProducts,
    categories,
    searchTerm,
    setSearchTerm,
    priceRange,
    setPriceRange,
    selectedCategory,
    setSelectedCategory,
    filtersVisible,
    setFiltersVisible,
    clearFilters
  } = useProductFilter(products);
  
  const { wishlistedProducts, handleWishlistToggle } = useWishlist();

  return {
    products,
    isLoading,
    filteredProducts,
    categories,
    searchTerm,
    setSearchTerm,
    priceRange,
    setPriceRange,
    selectedCategory,
    setSelectedCategory,
    filtersVisible,
    setFiltersVisible,
    wishlistedProducts,
    handleWishlistToggle,
    clearFilters
  };
};
