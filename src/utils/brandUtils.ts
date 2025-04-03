
import { Product } from "@/contexts/ProductContext";
import { toast } from "sonner";

/**
 * Handles finding or creating products for a specific brand
 */
export const handleBrandProducts = (
  brandName: string, 
  allProducts: Product[], 
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>
): Product[] => {
  if (!brandName || brandName.trim() === "") {
    console.log("No brand name provided");
    return [];
  }

  if (allProducts.length === 0) {
    console.log("No products available to filter");
    toast.info("Loading products...");
    return [];
  }
  
  console.log(`Looking for products for brand: ${brandName}`);
  
  // Case-insensitive brand name
  const brandNameLower = brandName.toLowerCase();
  
  // More flexible brand matching
  const productsByBrand = allProducts.filter(p => 
    (p.name && p.name.toLowerCase().includes(brandNameLower)) || 
    (p.vendor && p.vendor.toLowerCase().includes(brandNameLower)) ||
    (p.description && p.description.toLowerCase().includes(brandNameLower))
  );
  
  console.log(`Found ${productsByBrand.length} products for brand ${brandName}`);
  
  if (productsByBrand.length === 0) {
    // No products found for this brand, so create some temporary ones
    const tempProducts: Product[] = [];
    
    // Create 5 products for this brand
    for (let i = 0; i < 5; i++) {
      const randomProduct = allProducts[Math.floor(Math.random() * allProducts.length)];
      if (randomProduct) {
        const newProduct: Product = {
          ...randomProduct,
          id: Date.now() + i, // Ensure unique ID using timestamp
          name: `${brandName} ${randomProduct.name.split(' ').slice(1).join(' ')}`,
          vendor: brandName,
          category: randomProduct.category || "Clothing",
          description: `Premium ${brandName} ${randomProduct.category || "item"} with exceptional quality and style.`,
          isBestSeller: i === 0 // Make the first one a bestseller
        };
        tempProducts.push(newProduct);
      }
    }
    
    // Update products in context
    if (tempProducts.length > 0) {
      console.log(`Creating ${tempProducts.length} temporary products for brand ${brandName}`);
      
      // Add new products to the context
      setProducts(prev => {
        // Check if these products already exist to avoid duplicates
        const existingIds = new Set(prev.map(p => p.id));
        const uniqueNewProducts = tempProducts.filter(p => !existingIds.has(p.id));
        
        if (uniqueNewProducts.length > 0) {
          toast.success(`${brandName} products added to catalog`);
          return [...prev, ...uniqueNewProducts];
        }
        return prev;
      });
      
      return tempProducts;
    }
    
    toast.error(`Couldn't find or create products for ${brandName}`);
    return [];
  } else {
    toast.success(`Viewing ${brandName} products`);
    return productsByBrand;
  }
};
