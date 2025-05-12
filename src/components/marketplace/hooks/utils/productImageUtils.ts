
import { Product } from "@/types/product";

/**
 * Add mock images to products that don't have images
 * @param productsToUpdate Array of products to add images to
 * @returns Array of products with images added
 */
export const addMockImagesToProducts = (productsToUpdate: Product[]): Product[] => {
  const mockImageUrls = [
    "https://images.unsplash.com/photo-1611930022073-84f3bb594665?q=80&w=987&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?q=80&w=1032&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1585109649139-366815a0d713?q=80&w=1170&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=1164&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1592921870789-04563d55041c?q=80&w=1170&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?q=80&w=987&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1598509254521-921c70c753f3?q=80&w=1632&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=1180&auto=format&fit=crop"
  ];
  
  return productsToUpdate.map((product, index) => {
    // If the product doesn't already have an image, assign a mock one
    if (!product.image || product.image === "") {
      return {
        ...product,
        image: mockImageUrls[index % mockImageUrls.length]
      };
    }
    return product;
  });
};
