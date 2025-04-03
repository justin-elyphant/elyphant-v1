
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
  if (allProducts.length === 0) {
    toast.info("Loading products...");
    return [];
  }
  
  console.log(`Looking for products for brand: ${brandName}`);
  
  // More flexible brand matching
  const productsByBrand = allProducts.filter(p => 
    (p.name && p.name.toLowerCase().includes(brandName.toLowerCase())) || 
    (p.vendor && p.vendor.toLowerCase().includes(brandName.toLowerCase())) ||
    (p.description && p.description.toLowerCase().includes(brandName.toLowerCase()))
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
          id: 10000 + allProducts.length + i, // Ensure unique ID
          name: `${brandName} ${randomProduct.name.split(' ').slice(1).join(' ')}`,
          vendor: brandName,
          category: randomProduct.category || "Clothing",
          description: `Premium ${brandName} ${randomProduct.category || "item"} with exceptional quality and style.`
        };
        tempProducts.push(newProduct);
      }
    }
    
    // Update products in context
    if (tempProducts.length > 0) {
      console.log(`Creating ${tempProducts.length} temporary products for brand ${brandName}`);
      setProducts(prev => [...prev, ...tempProducts]);
      toast.success(`${brandName} products added to catalog`);
      return tempProducts;
    }
    
    return [];
  } else {
    toast.success(`Viewing ${brandName} products`);
    return productsByBrand;
  }
};
