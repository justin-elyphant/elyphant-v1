
// Utility to add images array (and fallback single image) for all mock/test products

import { Product } from "@/types/product";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158";

export function addMockImagesToProducts(products: Product[]): Product[] {
  return products.map((product, idx) => {
    // If already has images and a main image, preserve
    if (product.images && product.images.length && product.image)
      return product;
    const image = product.image || DEFAULT_IMAGE;
    return {
      ...product,
      image,
      images: [image],
    };
  });
}
