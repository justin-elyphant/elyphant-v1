/**
 * Exports all user-uploaded mock product image URLs and a utility for selecting one at random.
 */
export const MOCK_PRODUCT_IMAGE_URLS = [
  "/lovable-uploads/063e7c71-83e7-4f23-8149-243c5b14a4a0.png", // torn posters/collage
  "/lovable-uploads/9c691534-ab05-42ed-9ba2-51fff6b6bee6.png", // van gogh painting
  "/lovable-uploads/2329d2e9-b6cc-4a17-b2a4-48bffcb52320.png", // necklace
  "/lovable-uploads/43f8a9f8-fa27-411f-837d-460272917b95.png", // gold rings
  "/lovable-uploads/65682a51-b1be-4631-9f58-8591476a5eae.png", // tshirt on hanger
  "/lovable-uploads/4b2ea3c4-d649-4b8f-ac5e-a3e7b8fe875d.png", // sneakers (on person)
  "/lovable-uploads/7d144e75-076d-49c9-9247-80aee169f9de.png", // nike shoe against red
  "/lovable-uploads/fd0d7840-d7ea-4a76-8cd7-2debf6425643.png", // macbook topdown
  "/lovable-uploads/3a579c6a-531e-4121-8b6b-54e99b323189.png", // outfit
  "/lovable-uploads/01c4b454-a02e-4267-85d1-8f46be7acbfa.png", // macbook, logo lit
];

/**
 * Returns a random image URL from your mock product image set
 */
export function getRandomMockProductImage(seed?: number): string {
  const arr = MOCK_PRODUCT_IMAGE_URLS;
  if (!arr.length) return "/placeholder.svg";
  // If a seed is provided, make image selection deterministic for the product
  if (typeof seed === "number") {
    return arr[seed % arr.length];
  }
  // Otherwise pick purely random
  return arr[Math.floor(Math.random() * arr.length)];
}
