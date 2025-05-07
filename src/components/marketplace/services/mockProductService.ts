
import { Product } from "@/contexts/ProductContext";
import { normalizeProduct } from "@/contexts/ProductContext";

// Sample image URLs for products
const productImages = [
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
  "https://images.unsplash.com/photo-1546868871-7041f2a55e12",
  "https://images.unsplash.com/photo-1560343090-f0409e92791a",
  "https://images.unsplash.com/photo-1550009158-9ebf69173e03",
  "https://images.unsplash.com/photo-1600080972464-8e5f35f63d08"
];

// Generate a random product image URL
const getRandomImage = () => {
  const randomIndex = Math.floor(Math.random() * productImages.length);
  const sizeSuffix = "?w=400&h=400&fit=crop&auto=format";
  return `${productImages[randomIndex]}${sizeSuffix}`;
};

// Create a product with sample data
const createSampleProduct = (index: number, prefix = ""): Product => {
  const productId = `mock-${Date.now()}-${index}`;
  const brands = ["Nike", "Apple", "Samsung", "Sony", "Adidas", "Lego"];
  const categories = ["Electronics", "Clothing", "Home", "Books", "Toys", "Sports"];
  
  const brand = brands[Math.floor(Math.random() * brands.length)];
  const category = categories[Math.floor(Math.random() * categories.length)];
  const price = Math.floor(Math.random() * 200) + 10;
  const rating = (Math.random() * 2) + 3; // Rating between 3-5
  
  return normalizeProduct({
    product_id: productId,
    id: productId,
    name: `${prefix}${brand} ${category} Product ${index}`,
    title: `${prefix}${brand} ${category} Product ${index}`,
    description: `This is a sample description for ${brand} ${category} Product ${index}. It's a great product with many features.`,
    price: price,
    image: getRandomImage(),
    images: [getRandomImage(), getRandomImage(), getRandomImage()],
    category: category,
    brand: brand,
    vendor: "Mock Vendor",
    rating: rating,
    reviewCount: Math.floor(Math.random() * 500) + 10,
    isBestSeller: Math.random() > 0.8 // 20% chance of being a bestseller
  });
};

// Generate a list of mock products
export const getMockProducts = (count = 12): Product[] => {
  console.log("getMockProducts: Getting mock products");
  
  // Always return at least 4 products
  const productCount = Math.max(count, 4);
  
  const mockProducts = Array.from({ length: productCount }).map((_, index) => 
    createSampleProduct(index + 1)
  );
  
  console.log(`getMockProducts: Returning all ${mockProducts.length} products`);
  return mockProducts;
};

// Search for products with a search term
export const searchMockProducts = (searchTerm: string, count = 12): Product[] => {
  console.log(`Searching for mock products with term: "${searchTerm}"`);
  
  // Always return at least 4 products
  const productCount = Math.max(count, 4);
  
  // Create products that match the search term
  const mockProducts = Array.from({ length: productCount }).map((_, index) => 
    createSampleProduct(index + 1, `${searchTerm} `)
  );
  
  console.log(`searchMockProducts: Found ${mockProducts.length} products for "${searchTerm}"`);
  return mockProducts;
};

// Find a specific product by ID
export const findMockProductById = (productId: string): Product | null => {
  // If we don't have a real product, create one with the ID
  if (!productId) return null;
  
  const mockProduct = createSampleProduct(1);
  mockProduct.product_id = productId;
  mockProduct.id = productId;
  
  return mockProduct;
};

// Save products to local storage
export const saveMockProducts = (products: Product[]) => {
  try {
    localStorage.setItem('mockProducts', JSON.stringify(products));
    return true;
  } catch (e) {
    console.error('Error saving mock products to localStorage:', e);
    return false;
  }
};

// Load products from local storage
export const loadMockProducts = (): Product[] => {
  try {
    const savedProducts = localStorage.getItem('mockProducts');
    if (savedProducts) {
      return JSON.parse(savedProducts);
    }
  } catch (e) {
    console.error('Error loading mock products from localStorage:', e);
  }
  
  // If no saved products are found, generate new ones
  return getMockProducts();
};
