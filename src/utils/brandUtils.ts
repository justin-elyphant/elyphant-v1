
import { Product } from "@/contexts/ProductContext";
import { toast } from "sonner";
import { searchProducts } from "@/components/marketplace/zinc/services/productSearchService";
import { ZincProduct } from "@/components/marketplace/zinc/types";
import { convertZincProductToProduct } from "@/components/marketplace/zinc/utils/productConverter";

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
  toast.loading(`Looking for ${brandName} products...`, { id: "loading-brand-products" });
  
  try {
    // Search for products using the Zinc API
    console.log(`Fetching ${brandName} products from Zinc API`);
    const zincResults = await searchProducts(brandName);
    
    if (zincResults && zincResults.length > 0) {
      console.log(`Found ${zincResults.length} products for ${brandName} from Zinc API`);
      
      // Convert all products to our format
      const brandProducts = zincResults.map(product => {
        // Add the current brand name to the product's brand field to ensure it's included
        if (!product.brand) {
          product.brand = brandName;
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
          toast.success(`Found ${brandProducts.length} ${brandName} products`, { id: "loading-brand-products" });
          
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
    return [];
  }
};
