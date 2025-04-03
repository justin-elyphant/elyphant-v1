
import { ZincProduct } from "../types";
import { Product } from "@/contexts/ProductContext";
import { generateDescription } from "./descriptions/descriptionGenerator";
import { createProductImages } from "./images/productImageGenerator";

/**
 * Convert a ZincProduct to our application Product format
 */
export const convertZincProductToProduct = (zincProduct: ZincProduct, index: number): Product => {
  // Generate a description if one doesn't exist
  const productDescription = zincProduct.description || generateDescription(zincProduct.title, zincProduct.category || "Electronics");
  
  // Generate mock features
  const features = [
    `Premium ${zincProduct.category || "product"} for everyday use`,
    `Enhanced durability and reliability`,
    `Stylish design perfect for any setting`,
    `Easy to clean and maintain`
  ];
  
  // Generate mock specifications
  const specifications: Record<string, string> = {
    "Brand": zincProduct.title.split(' ')[0],
    "Material": "Premium quality",
    "Origin": "Imported"
  };
  
  // Generate mock multiple images for the product
  const productImages = createProductImages(
    zincProduct.image || "/placeholder.svg", 
    zincProduct.title
  );
  
  return {
    id: 1000 + index,
    name: zincProduct.title,
    price: zincProduct.price,
    category: zincProduct.category || "Electronics",
    image: zincProduct.image || "/placeholder.svg",
    vendor: "Elyphant", // Changed from "Amazon via Zinc"
    description: productDescription,
    features: features,
    specifications: specifications,
    images: productImages,
    isBestSeller: zincProduct.isBestSeller || false
  };
};
