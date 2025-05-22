
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

// Robust category mapping, to match slugs to readable names.
const slugToCategory = (slug: string) => {
  // Convert slug-like string (e.g. 'art-collectibles') to 'Art & Collectibles'
  const mapping: Record<string, string> = {
    "art-collectibles": "Art & Collectibles",
    "bath-beauty": "Bath & Beauty",
    "bags-purses": "Bags & Purses",
    "books-movies-music": "Books, Movies & Music",
    "craft-supplies": "Craft Supplies & Tools",
    "home-living": "Home & Living",
    "toys-games": "Toys & Games",
    "wedding-party": "Wedding & Party",
    // fallback
  };
  if (mapping[slug]) return mapping[slug];
  // Replace dashes with spaces and capitalize
  return slug
    .split("-")
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
};

export function searchMockProducts(
  query: string,
  maxResults: number = 10
): Product[] {
  // Fallback logic: turn dash-slugs into display names
  let displayCategory = query;
  if (query.includes("-") && !query.includes(" ")) {
    displayCategory = slugToCategory(query);
  }
  // Generate a consistent set of mock products.
  const now = Date.now();
  const products: Product[] = [];
  const categories = [
    "Electronics", "Home", "Gadgets", "Fashion", "Fitness",
    "Books", "Outdoors", "Toys", "Art & Collectibles"
  ];

  // Always ensure at least one mock category matches the search
  const mainCategory = categories
    .find((cat) =>
      displayCategory.toLowerCase().replace(/[^a-z]/g, "") // ignore non-letters
        .includes(cat.toLowerCase().replace(/[^a-z]/g, ""))
    ) || displayCategory || "Gifts";

  for (let i = 0; i < maxResults; i++) {
    // FIX: price must be a number type
    const price = Math.round((Math.random() * 90 + 10) * 100) / 100;
    products.push({
      product_id: `MOCK-${now}-${i}`,
      title: `${displayCategory ? displayCategory : 'Sample'} Product ${i + 1}`,
      price: price, // number
      image: getRandomImage(i),
      description: `This is a sample description for ${displayCategory || "a mock"} product (No. ${i + 1}) for testing wishlists, cart actions, and shopping experience.`,
      brand: i % 2 === 0 ? "TestBrand" : "BrandX",
      category: mainCategory,
      retailer: "Amazon via Zinc",
      rating: 4 + Math.random(),
      reviewCount: 100 + i * 13,
      isBestSeller: i === 0,
      features: [`Feature ${i + 1}A`, `Feature ${i + 1}B`],
      images: [getRandomImage(i)],
    });
  }
  return products;
}

// Quick generic getter for fallback tests
export function getMockProducts(count: number = 8): Product[] {
  return searchMockProducts("Mock", count);
}

