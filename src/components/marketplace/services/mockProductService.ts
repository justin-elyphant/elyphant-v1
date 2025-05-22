
import { Product } from "@/types/product";

// Helper function: get random placeholder image
const getRandomImage = (idx: number) => {
  const urls = [
    "https://images.unsplash.com/photo-1649972904349-6e44c42644a7", // woman sitting on bed, laptop
    "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b", // gray laptop
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158", // woman in white shirt, laptop
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5", // Matrix movie still
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb", // Water/trees
    "https://images.unsplash.com/photo-1582562124811-c09040d0a901", // Cat
  ];
  return urls[idx % urls.length];
};

export function searchMockProducts(
  query: string,
  maxResults: number = 10
): Product[] {
  // Generate a consistent set of mock products.
  const now = Date.now();
  const products: Product[] = [];
  const categories = ["Electronics", "Home", "Gadgets", "Fashion", "Fitness", "Books", "Outdoors", "Toys"];
  for (let i = 0; i < maxResults; i++) {
    products.push({
      product_id: `MOCK-${now}-${i}`,
      title: `${query ? query : 'Sample'} Product ${i + 1}`,
      price: (Math.random() * 90 + 10).toFixed(2) as unknown as number,
      image: getRandomImage(i),
      description: `This is a sample description for ${query || "a mock"} product (No. ${i + 1}) for testing wishlists, cart actions, and shopping experience.`,
      brand: i % 2 === 0 ? "TestBrand" : "BrandX",
      category: categories[i % categories.length],
      retailer: "Amazon via Zinc",
      rating: 4 + Math.random(),
      reviewCount: 100 + i * 13, // changed from review_count to reviewCount
      isBestSeller: i === 0,
      features: [`Feature ${i+1}A`, `Feature ${i+1}B`],
      images: [getRandomImage(i)],
    });
  }
  return products;
}

// Quick generic getter for fallback tests
export function getMockProducts(count: number = 8): Product[] {
  return searchMockProducts("Mock", count);
}
