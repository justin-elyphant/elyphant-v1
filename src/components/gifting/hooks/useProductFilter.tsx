
import { Product } from "@/contexts/ProductContext";
import { useSearchFilter } from "./useSearchFilter";
import { useCategoryFilter } from "./useCategoryFilter";
import { usePriceFilter } from "./usePriceFilter";
import { useFilterVisibility } from "./useFilterVisibility";
import { useFilteredProducts } from "./useFilteredProducts";

export const useProductFilter = (products: Product[]) => {
  const { searchTerm, setSearchTerm } = useSearchFilter();
  const { categories, selectedCategory, setSelectedCategory } = useCategoryFilter(products);
  const { priceRange, setPriceRange } = usePriceFilter();
  const { filtersVisible, setFiltersVisible } = useFilterVisibility();
  
  const filteredProducts = useFilteredProducts(products, searchTerm, selectedCategory, priceRange);
  
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setPriceRange("all");
  };

  return {
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
  };
};
