import { useLocation } from "react-router-dom";
import { getCategoryName } from "./utils/categoryUtils";
import { Product } from "@/contexts/ProductContext";

export const usePageInfo = (currentCategory: string | null, filteredProducts: Product[]) => {
  const location = useLocation();

  const getPageInfo = () => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get("search");
    const pageTitleParam = params.get("pageTitle");
    const categoryName = getCategoryName(currentCategory);
    
    // If a pageTitle is provided in the URL params, use that
    if (pageTitleParam) {
      return { 
        pageTitle: pageTitleParam, 
        subtitle: `Browse our selection of ${filteredProducts.length} products`
      };
    }
    
    // Otherwise, fall back to the default behavior
    const pageTitle = searchParam ? `Search results for "${searchParam}"` : categoryName;
    const subtitle = searchParam 
      ? `Found ${filteredProducts.length} items matching your search`
      : `Browse our collection of ${currentCategory ? categoryName.toLowerCase() : "products"}`;

    return { pageTitle, subtitle };
  };

  return { getPageInfo };
};
