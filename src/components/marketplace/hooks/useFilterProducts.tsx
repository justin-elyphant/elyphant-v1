
import { useState } from "react";
import { Product } from "@/contexts/ProductContext";

export const useFilterProducts = (products: Product[], resultsLimit: number) => {
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);
  
  const filterByCategory = (categoryParam: string | null) => {
    if (categoryParam) {
      const filtered = products.filter(product => product.category === categoryParam);
      setFilteredProducts(filtered.length ? filtered.slice(0, resultsLimit) : products.slice(0, resultsLimit));
      return filtered;
    } else {
      setFilteredProducts(products.slice(0, resultsLimit));
      return products;
    }
  };
  
  const filterBySearch = (searchParam: string, amazonProducts: Product[]) => {
    // Filter store products by search term
    const storeProducts = products.filter(product => 
      product.vendor !== "Amazon via Zinc" && product.vendor !== "Elyphant" && 
      (product.name.toLowerCase().includes(searchParam.toLowerCase()) || 
      (product.description && product.description.toLowerCase().includes(searchParam.toLowerCase())))
    );
    
    // Set the filtered products
    if (amazonProducts.length > 0) {
      // Combine Amazon products with matching store products
      setFilteredProducts([...amazonProducts.slice(0, resultsLimit), ...storeProducts]);
      return [...amazonProducts, ...storeProducts];
    } else {
      // Just show matching store products
      setFilteredProducts(storeProducts.slice(0, resultsLimit));
      return storeProducts;
    }
  };

  return {
    filteredProducts,
    setFilteredProducts,
    filterByCategory,
    filterBySearch
  };
};
