
import { ZincProduct } from "../types";

/**
 * Generate mock search results for product searches
 * Used when API key is not set or when in test mode
 */
export const generateMockSearchResults = (query: string, maxResults: number = 10): ZincProduct[] => {
  console.log(`Generating mock results for "${query}"`);
  
  const searchTerm = query.toLowerCase();
  
  // Generate a consistent set of mock products based on search term
  const products: ZincProduct[] = [];
  
  // Use popular brands for more realistic results
  const brands = ["Apple", "Samsung", "Sony", "Google", "Microsoft", "LG", "Dell", "HP", "Bose", "Amazon"];
  
  // Use realistic categories
  const categories = [
    "Smartphone", "Laptop", "Headphones", "Tablet", "Smartwatch", 
    "Camera", "TV", "Monitor", "Speaker", "Gaming Console"
  ];
  
  for (let i = 0; i < Math.min(maxResults, 10); i++) {
    const productId = `MOCK${Math.floor(Math.random() * 1000000)}`;
    const brandIndex = i % brands.length;
    const categoryIndex = i % categories.length;
    const brand = brands[brandIndex];
    const category = categories[categoryIndex];
    
    // Add search term to title for relevance
    const title = `${brand} ${searchTerm} ${category} (2023 Model)`;
    
    // Consistent but varied pricing
    const price = 49 + (i * 10);
    
    // Set a default image URL by category
    let imageUrl = "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=500&h=500&fit=crop";
    
    // Add the product to results
    products.push({
      product_id: productId,
      title,
      price,
      image: imageUrl,
      description: `Experience the amazing ${brand} ${category} featuring the latest technology and premium design. Perfect for everyday use, this ${category.toLowerCase()} offers outstanding performance and reliability.`,
      brand,
      category,
      retailer: "Amazon via Zinc",
      rating: 4 + Math.random(),
      review_count: 500 + Math.floor(Math.random() * 500),
      isBestSeller: i < 2, // Make the first two items best sellers
      features: [
        `Latest ${brand} technology`,
        "High performance processor",
        "Premium design and build quality",
        "Extended battery life",
        "1-year warranty included"
      ],
      images: [imageUrl]
    });
    
    console.log(`Added fallback image for product: ${title}`);
    console.log(`Created images array for product: ${title}`);
  }
  
  console.log(`Generated ${products.length} mock results for "${query}"`);
  return products;
};
