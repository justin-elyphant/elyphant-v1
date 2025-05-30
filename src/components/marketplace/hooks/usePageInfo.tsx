
import { useLocation } from "react-router-dom";
import { getCategoryName } from "./utils/category/categoryNames";
import { Product } from "@/contexts/ProductContext";

export const usePageInfo = (currentCategory: string | null, filteredProducts: Product[]) => {
  const location = useLocation();

  const getPageInfo = () => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get("search");
    const categoryName = getCategoryName(currentCategory);
    const pageTitle = searchParam ? `Search results for "${searchParam}"` : categoryName;
    const subtitle = searchParam 
      ? `Found ${filteredProducts.length} items matching your search`
      : `Browse our collection of ${currentCategory ? categoryName.toLowerCase() : "products"}`;

    return { pageTitle, subtitle };
  };

  return { getPageInfo };
};
