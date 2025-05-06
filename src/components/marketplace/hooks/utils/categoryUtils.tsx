
import { Product } from "@/contexts/ProductContext";

export const getSortOptions = () => {
  return [
    { value: "relevance", label: "Relevance" },
    { value: "price-low-high", label: "Price: Low to High" },
    { value: "price-high-low", label: "Price: High to Low" },
    { value: "newest", label: "Newest" },
    { value: "rating", label: "Highest Rated" },
  ];
};

export const sortProducts = (products: Product[] = [], sortOption: string): Product[] => {
  if (!products || products.length === 0) {
    return [];
  }

  const clonedProducts = [...products];
  
  switch (sortOption) {
    case "price-low-high":
      return clonedProducts.sort((a, b) => 
        (a.price || 0) - (b.price || 0)
      );
    case "price-high-low":
      return clonedProducts.sort((a, b) => 
        (b.price || 0) - (a.price || 0)
      );
    case "newest":
      return clonedProducts.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });
    case "rating":
      return clonedProducts.sort((a, b) => {
        const ratingA = a.stars || a.rating || 0;
        const ratingB = b.stars || b.rating || 0;
        return ratingB - ratingA;
      });
    default: // relevance or any other
      return clonedProducts;
  }
};
