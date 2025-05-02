
import { Product } from "@/types/product";

/**
 * Generate fallback Apple products to prevent freezing
 */
export function getAppleFallbackProducts(): Product[] {
  return [
    {
      id: "1001",
      name: "Apple iPhone 13 Pro",
      price: 999,
      category: "Electronics",
      image: "https://images.unsplash.com/photo-1632661674596-df8be070a5c5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80",
      vendor: "Apple",
      description: "The latest iPhone with A15 Bionic chip and Pro camera system",
      rating: 4.8,
      reviewCount: 1245,
      brand: "Apple",
      isBestSeller: true
    },
    {
      id: "1002",
      name: "Apple MacBook Pro 14-inch",
      price: 1999,
      category: "Electronics",
      image: "https://images.unsplash.com/photo-1639249227523-85a5dafcd4c7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80",
      vendor: "Apple",
      description: "Powerful MacBook Pro with M1 Pro or M1 Max chip",
      rating: 4.9,
      reviewCount: 856,
      brand: "Apple"
    },
    {
      id: "1003",
      name: "Apple iPad Pro 12.9-inch",
      price: 1099,
      category: "Electronics",
      image: "https://images.unsplash.com/photo-1557825835-70d97c4aa567?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80",
      vendor: "Apple",
      description: "The ultimate iPad experience with M1 chip",
      rating: 4.7,
      reviewCount: 623,
      brand: "Apple"
    }
  ];
}

/**
 * Handle loading brand-specific products
 */
export async function handleBrandProducts(
  brandName: string, 
  existingProducts: Product[], 
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>
): Promise<Product[]> {
  // Check if we already have products for this brand
  const existingBrandProducts = existingProducts.filter(
    p => (p.name && p.name.toLowerCase().includes(brandName.toLowerCase())) ||
         (p.brand && p.brand.toLowerCase().includes(brandName.toLowerCase()))
  );

  if (existingBrandProducts.length > 0) {
    console.log(`Found ${existingBrandProducts.length} existing products for brand ${brandName}`);
    return existingBrandProducts;
  }

  // Generate some mock products for the brand
  const brandProducts: Product[] = [];
  const categories = ["Electronics", "Clothing", "Footwear", "Accessories"];
  
  for (let i = 0; i < 8; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const price = Math.floor(Math.random() * 200) + 50;
    
    brandProducts.push({
      id: `2000${i}`,
      name: `${brandName} ${category} Item ${i+1}`,
      price: price,
      category: category,
      image: `https://source.unsplash.com/random/300x300/?${encodeURIComponent(brandName)}`,
      vendor: brandName,
      description: `A high-quality ${category.toLowerCase()} product from ${brandName}`,
      rating: 4 + Math.random(),
      reviewCount: Math.floor(Math.random() * 500) + 10,
      brand: brandName,
      isBestSeller: i < 2 // Make the first couple items best sellers
    });
  }

  // Update products context
  setProducts(prev => [...prev, ...brandProducts]);
  
  return brandProducts;
}
