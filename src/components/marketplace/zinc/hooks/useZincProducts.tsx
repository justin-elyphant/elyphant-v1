
import { useState } from "react";
import { useZincSearch } from "./useZincSearch";
import { useZincProductSync } from "./useZincProductSync";
import { useProducts } from "@/contexts/ProductContext";
import { ZincProduct } from "../types";
import { Product } from "@/contexts/ProductContext";
import { generateDescription } from "../utils/descriptions/descriptionGenerator";

export const useZincProducts = () => {
  const { search, isLoading: isSearchLoading, error: searchError, searchTerm, setSearchTerm } = useZincSearch();
  const { setProducts } = useProducts();
  
  // For the useZincProductSync hook, we'll provide an updateLastSync function
  const updateLastSync = () => {
    // In a real implementation, this would update the last sync time in the context or localStorage
    const connection = JSON.parse(localStorage.getItem("zincConnection") || "{}");
    connection.lastSync = Date.now();
    localStorage.setItem("zincConnection", JSON.stringify(connection));
  };
  
  const { syncProducts: syncZincProducts, isLoading: isSyncLoading, error: syncError } = useZincProductSync(updateLastSync);

  // Helper function to create multiple images for a product
  const createProductImages = (mainImage: string, productTitle: string): string[] => {
    if (!mainImage || mainImage === "/placeholder.svg") {
      return ["/placeholder.svg"];
    }
    
    // Generate 3-5 mock images based on the main image
    // In a real app these would come from the API
    const numImages = Math.floor(Math.random() * 3) + 3; // 3-5 images
    const images = [mainImage];
    
    // Create variation of the main image URL to simulate different product views
    for (let i = 1; i < numImages; i++) {
      // Add a parameter to the URL to make it look like a different image
      const imageUrl = mainImage.includes('?') 
        ? `${mainImage}&view=${i}` 
        : `${mainImage}?view=${i}`;
      images.push(imageUrl);
    }
    
    return images;
  };

  // Helper function to convert ZincProduct to Product
  const convertZincProductToProduct = (zincProduct: ZincProduct, index: number): Product => {
    // Generate a description if one doesn't exist
    const productDescription = zincProduct.description || generateDescription(zincProduct.title, zincProduct.category || "Electronics");
    
    // Generate mock features
    const features = [
      `Premium ${zincProduct.category || "product"} for everyday use`,
      `Enhanced durability and reliability`,
      `Stylish design perfect for any setting`,
      `Easy to clean and maintain`
    ];
    
    // Generate mock specifications
    const specifications: Record<string, string> = {
      "Brand": zincProduct.title.split(' ')[0],
      "Material": "Premium quality",
      "Origin": "Imported"
    };
    
    // Generate mock multiple images for the product
    const productImages = createProductImages(
      zincProduct.image || "/placeholder.svg", 
      zincProduct.title
    );
    
    return {
      id: 1000 + index,
      name: zincProduct.title,
      price: zincProduct.price,
      category: zincProduct.category || "Electronics",
      image: zincProduct.image || "/placeholder.svg",
      vendor: "Elyphant", // Changed from "Amazon via Zinc"
      description: productDescription,
      features: features,
      specifications: specifications,
      images: productImages // Add multiple images
    };
  };

  // Combined handleSearch that uses the search hook but also updates the product context
  const handleSearch = async (term: string) => {
    const results = await search(term);
    
    // Update products in context
    if (results.length > 0) {
      setProducts(prevProducts => {
        // Filter out any existing Amazon products
        const nonAmazonProducts = prevProducts.filter(p => p.vendor !== "Amazon via Zinc" && p.vendor !== "Elyphant");
        
        // Convert ZincProduct to Product format
        const amazonProducts = results.map(convertZincProductToProduct);
        
        // Add the new Amazon products
        return [...nonAmazonProducts, ...amazonProducts];
      });
    }
    
    return results;
  };

  // Wrapper for syncProducts that handles the type conversion
  const syncProducts = async () => {
    const results = await syncZincProducts();
    
    if (results.length > 0) {
      setProducts(prevProducts => {
        // Filter out any existing Amazon products
        const nonAmazonProducts = prevProducts.filter(p => p.vendor !== "Amazon via Zinc" && p.vendor !== "Elyphant");
        
        // Convert ZincProduct to Product format
        const amazonProducts = results.map(convertZincProductToProduct);
        
        // Add the new Amazon products
        return [...nonAmazonProducts, ...amazonProducts];
      });
    }
    
    return results;
  };

  return {
    searchTerm,
    setSearchTerm,
    syncProducts,
    handleSearch,
    isLoading: isSearchLoading || isSyncLoading,
    error: searchError || syncError
  };
};
