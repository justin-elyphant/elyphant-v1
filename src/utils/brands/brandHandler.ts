import { Product } from "@/contexts/ProductContext";
import { toast } from "sonner";
import { searchProducts } from "@/components/marketplace/zinc/services/productSearchService";
import { ZincProduct } from "@/components/marketplace/zinc/types";
import { convertZincProductToProduct } from "@/components/marketplace/zinc/utils/productConverter";
import { getAppleFallbackProducts } from "./fallbackProducts";
import { generateDescription } from "@/components/marketplace/zinc/utils/productDescriptionUtils";
import { productCatalogService } from "@/services/ProductCatalogService";

// Minimum number of products to return for a brand
const MIN_PRODUCTS_COUNT = 75;

/**
 * Handles finding or loading products for a specific brand from the Zinc API
 */
export const handleBrandProducts = async (
  brandName: string, 
  allProducts: Product[], 
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>
): Promise<Product[]> => {
  if (!brandName || brandName.trim() === "") {
    console.log("No brand name provided");
    toast.dismiss("loading-brand-products");
    return [];
  }

  console.log(`Looking for products for brand: ${brandName}`);
  
  // Show loading toast
  // Silently look for products - no toast needed
  
  try {
    // Check if we already have products for this brand to avoid duplicate API calls
    const existingProducts = allProducts.filter(p => 
      (p.brand && p.brand.toLowerCase() === brandName.toLowerCase()) ||
      (p.name && p.name.toLowerCase().includes(brandName.toLowerCase()))
    );
    
    if (existingProducts.length >= MIN_PRODUCTS_COUNT) {
      console.log(`Using ${existingProducts.length} existing products for ${brandName}`);
      // Silently complete - no toast needed
      return existingProducts;
    }
    
    // Use the new brand categories search for better results across multiple product types
    console.log(`Fetching ${brandName} products using brand category search`);
    
    // Create a promise that will time out after 15 seconds
    const timeoutPromise = new Promise<any>((_, reject) => {
      setTimeout(() => reject(new Error("API request timed out")), 15000);
    });
    
    // Race the API call against the timeout
    const zincResponse = await Promise.race([
      enhancedZincApiService.searchBrandCategories(brandName, MIN_PRODUCTS_COUNT),
      timeoutPromise
    ]);
    
    const zincResults = zincResponse.results || [];
    
    if (zincResults && zincResults.length > 0) {
      console.log(`Found ${zincResults.length} products for ${brandName} from Zinc API`);
      
      // Convert all products to our format
      const brandProducts = zincResults.map(product => {
        // Add the current brand name to the product's brand field to ensure it's included
        if (!product.brand) {
          product.brand = brandName;
        }
        
        // Make sure description is set before conversion
        if (!product.description) {
          product.description = generateDescription(product.title || "Unknown Product", product.category || "Electronics");
        }
        
        return convertZincProductToProduct(product);
      });
      
      if (brandProducts.length > 0) {
        // Update products in context - add these to existing products
        setProducts(prev => {
          // Remove any existing Amazon products for this brand to avoid duplicates
          const filteredProducts = prev.filter(p => 
            !(p.vendor === "Amazon via Zinc" && 
              (p.name.toLowerCase().includes(brandName.toLowerCase()) || 
              (p.brand && p.brand.toLowerCase().includes(brandName.toLowerCase())) ||
              (p.description && p.description.toLowerCase().includes(brandName.toLowerCase()))))
          );
          
          const newProducts = [...filteredProducts, ...brandProducts];
          console.log(`Updated products context with ${newProducts.length} total products, ${brandProducts.length} for ${brandName}`);
          
          // Dismiss the loading toast and show success
          // Silently complete - no toast needed
          
          return newProducts;
        });
        
        return brandProducts;
      } else {
        console.log(`No relevant products found for ${brandName} from Zinc API`);
        toast.error(`No products found for ${brandName}`, { id: "loading-brand-products" });
        return [];
      }
    } else {
      console.log(`No products found for ${brandName} from Zinc API`);
      toast.error(`No products found for ${brandName}`, { id: "loading-brand-products" });
      return [];
    }
  } catch (error) {
    console.error(`Error fetching ${brandName} products:`, error);
    toast.error(`Couldn't fetch products for ${brandName}`, { id: "loading-brand-products" });
    
    // If this is Apple, provide fallback Apple products to avoid showing fruits
    if (brandName.toLowerCase() === "apple") {
      console.log("Using fallback Apple products");
      const fallbackAppleProducts = getAppleFallbackProducts(MIN_PRODUCTS_COUNT); // Request the minimum number
      
      // Update products in context
      setProducts(prev => {
        // Remove any existing Amazon products for Apple
        const filteredProducts = prev.filter(p => 
          !(p.vendor === "Amazon via Zinc" && 
            (p.name.toLowerCase().includes("apple") || 
            (p.brand && p.brand.toLowerCase().includes("apple")) ||
            (p.description && p.description.toLowerCase().includes("apple"))))
        );
        
        const newProducts = [...filteredProducts, ...fallbackAppleProducts];
        // Silently complete - no toast needed
        return newProducts;
      });
      
      return fallbackAppleProducts;
    }
    
    return [];
  }
};
