
import { Product } from "@/contexts/ProductContext";
import { toast } from "sonner";
import { searchProducts } from "@/components/marketplace/zinc/zincService";

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
    return [];
  }

  console.log(`Looking for products for brand: ${brandName}`);
  toast.loading("Loading products...", { id: "loading-brand-products" });
  
  try {
    // Search for products using the Zinc API
    console.log(`Fetching ${brandName} products from Zinc API`);
    const zincResults = await searchProducts(brandName);
    
    if (zincResults && zincResults.length > 0) {
      console.log(`Found ${zincResults.length} products for ${brandName} from Zinc API`);
      
      // Convert Zinc products to our product format
      const brandProducts = zincResults.map((product, index) => ({
        id: Date.now() + index, // Ensure unique ID
        name: product.title,
        price: product.price,
        category: product.category || "Clothing",
        image: product.image || "/placeholder.svg",
        vendor: "Amazon via Zinc",
        description: product.description || `${brandName} product with exceptional quality.`,
        rating: product.rating || 4.5,
        reviewCount: product.review_count || 100,
        images: product.images || [product.image || "/placeholder.svg"],
        isBestSeller: index < Math.ceil(zincResults.length * 0.1) // Top 10% are bestsellers
      }));
      
      // Update products in context - add these to existing products
      setProducts(prev => {
        // Remove any existing products from this brand to avoid duplicates
        const filteredProducts = prev.filter(p => 
          !(p.vendor === "Amazon via Zinc" && 
            (p.name.toLowerCase().includes(brandName.toLowerCase()) || 
             (p.description && p.description.toLowerCase().includes(brandName.toLowerCase()))))
        );
        
        toast.success(`Viewing ${brandName} products`, { id: "loading-brand-products" });
        return [...filteredProducts, ...brandProducts];
      });
      
      return brandProducts;
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
