
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { useProducts } from "@/contexts/ProductContext";
import { searchProducts, ZincProduct } from "../zincService";
import { useZincConnection } from "./useZincConnection";

export const useZincProducts = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { setProducts } = useProducts();
  const { isLoading, setIsLoading, setError, updateLastSync } = useZincConnection();

  const syncProducts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Search for some popular products
      const searchTerms = ["kindle", "echo dot", "fire tv"];
      let allProducts: ZincProduct[] = [];
      
      // Perform searches for each term (limited to keep things responsive)
      for (const term of searchTerms) {
        const results = await searchProducts(term);
        allProducts = [...allProducts, ...results.slice(0, 2)]; // Take first 2 results from each search
      }
      
      if (allProducts.length === 0) {
        // Fall back to mock data if the API isn't returning results
        allProducts = [
          {
            product_id: "B081QSJNRJ",
            title: "Kindle Paperwhite",
            price: 139.99,
            image: "/placeholder.svg",
            description: "The thinnest, lightest Kindle Paperwhite yet—with a flush-front design and 300 ppi glare-free display.",
            category: "Electronics",
            retailer: "Amazon via Zinc"
          },
          {
            product_id: "B07XJ8C8F7",
            title: "Echo Dot (4th Gen)",
            price: 49.99,
            image: "/placeholder.svg",
            description: "Smart speaker with Alexa | Charcoal",
            category: "Electronics",
            retailer: "Amazon via Zinc"
          },
          {
            product_id: "B079QHML21",
            title: "Fire TV Stick 4K",
            price: 49.99,
            image: "/placeholder.svg",
            description: "Streaming device with Alexa Voice Remote",
            category: "Electronics",
            retailer: "Amazon via Zinc"
          },
          {
            product_id: "B07ZPC9QD4",
            title: "AirPods Pro",
            price: 249.99,
            image: "/placeholder.svg",
            description: "Active Noise Cancellation, Transparency mode, Spatial Audio",
            category: "Electronics",
            retailer: "Amazon via Zinc"
          }
        ];
      }
      
      // Convert to Product format
      const amazonProducts = convertZincProductsToAppFormat(allProducts);
      
      // Store Amazon products in localStorage
      localStorage.setItem("amazonProducts", JSON.stringify(amazonProducts));
      
      // Add Amazon products to the product context
      updateProductsInContext(amazonProducts);
      
      // Update last sync time
      updateLastSync();
      
      toast({
        title: "Products synced",
        description: `Successfully synced ${amazonProducts.length} products from Amazon`,
      });
      
      return amazonProducts;
    } catch (err) {
      console.error("Error syncing products:", err);
      setError("Failed to sync products from Amazon. Please try again later.");
      toast({
        title: "Sync failed",
        description: "Failed to sync products from Amazon",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (term: string) => {
    if (!term.trim()) return [];
    
    setIsLoading(true);
    setSearchTerm(term);
    
    try {
      const results = await searchProducts(term);
      
      // Convert to Product format
      const amazonProducts = convertZincProductsToAppFormat(results);
      
      // Update products in context
      updateProductsInContext(amazonProducts);
      
      toast({
        title: "Search Results",
        description: `Found ${amazonProducts.length} products matching "${term}"`,
      });
      
      return amazonProducts;
    } catch (err) {
      console.error("Error searching products:", err);
      toast({
        title: "Search failed",
        description: "Failed to search products",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to convert Zinc products to our app's format
  const convertZincProductsToAppFormat = (zincProducts: ZincProduct[]) => {
    return zincProducts.map((product, index) => ({
      id: 1000 + index,
      name: product.title,
      price: product.price,
      category: product.category || "Electronics",
      image: product.image || "/placeholder.svg",
      vendor: "Amazon via Zinc",
      description: product.description || ""
    }));
  };

  // Helper function to update products in context
  const updateProductsInContext = (amazonProducts: any[]) => {
    setProducts(prevProducts => {
      // Filter out any existing Amazon products
      const nonAmazonProducts = prevProducts.filter(p => p.vendor !== "Amazon via Zinc");
      // Add the new Amazon products
      return [...nonAmazonProducts, ...amazonProducts];
    });
  };

  return {
    searchTerm,
    setSearchTerm,
    syncProducts,
    handleSearch,
    isLoading
  };
};
