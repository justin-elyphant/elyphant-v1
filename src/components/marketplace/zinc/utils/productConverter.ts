
import { ZincProduct } from "../types";
import { Product } from "@/contexts/ProductContext";

/**
 * Parse a product ID string into a number with fallback
 */
const parseProductId = (productIdString: string | undefined): number => {
  // If undefined, return a random number
  if (!productIdString) {
    console.log("Missing product_id, generating random ID");
    return Math.floor(Math.random() * 100000);
  }
  
  try {
    // Remove any non-numeric characters and parse
    const cleaned = String(productIdString).replace(/\D/g, '');
    const parsed = parseInt(cleaned, 10);
    
    // If parsed is NaN or 0, generate random number
    if (isNaN(parsed) || parsed === 0) {
      console.log(`Invalid product_id format: "${productIdString}", generating random ID`);
      return Math.floor(Math.random() * 100000);
    }
    
    return parsed;
  } catch (e) {
    console.error(`Error parsing product_id: "${productIdString}"`, e);
    return Math.floor(Math.random() * 100000);
  }
};

/**
 * Convert a Zinc product to our Product format
 */
export const convertZincProductToProduct = (zincProduct: ZincProduct): Product => {
  // Log data source for debugging
  console.log(`Converting Zinc product: ${zincProduct.title} (${zincProduct.product_id})`);
  
  // Make sure we're handling images properly
  const productImage = zincProduct.images?.[0] || zincProduct.image || "/placeholder.svg";
  const productImages = zincProduct.images || (zincProduct.image ? [zincProduct.image] : ["/placeholder.svg"]);
  
  // Create a formatted description
  const description = zincProduct.description || 
    `${zincProduct.title} by ${zincProduct.brand || 'Unknown'} - ${zincProduct.category || 'Product'}`;
  
  // Convert price to number with fallback
  const priceValue = typeof zincProduct.price === 'number' 
    ? zincProduct.price 
    : parseFloat(String(zincProduct.price || 0)) || 0;
  
  // Convert rating to number with fallback
  const rating = typeof zincProduct.rating === 'number' 
    ? zincProduct.rating 
    : parseFloat(String(zincProduct.rating || 0)) || 0;
      
  // Convert review count to number with fallback
  const reviewCount = typeof zincProduct.review_count === 'number'
    ? zincProduct.review_count
    : parseInt(String(zincProduct.review_count || 0), 10) || 0;
  
  // Convert the string product_id to a number
  const productIdAsNumber = parseProductId(zincProduct.product_id);
  
  // Log data consistency issues for debugging
  if (!zincProduct.image && !zincProduct.images?.length) {
    console.warn(`No images for product: ${zincProduct.title} (${zincProduct.product_id})`);
  }
  
  if (priceValue > 1000) {
    console.warn(`Unusually high price for ${zincProduct.title}: $${priceValue}`);
  }
  
  return {
    id: productIdAsNumber,
    name: zincProduct.title,
    price: priceValue,
    description: description,
    category: zincProduct.category || "Unknown",
    vendor: "Amazon via Zinc",
    image: productImage,
    images: productImages,
    rating: rating,
    reviewCount: reviewCount,
    brand: zincProduct.brand || "Unknown", 
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // Store the original zinc product data too
    originalZincProduct: zincProduct
  };
};

/**
 * Convert our Product format back to a Zinc product
 */
export const convertProductToZincProduct = (product: Product): ZincProduct => {
  // For product_id, ensure we have a string (force conversion)
  const productId = String(product.id);
  
  // Explicitly handle price to ensure it's a number
  let priceValue: number = 0;
  if (typeof product.price === 'number') {
    priceValue = product.price;
  } else {
    // Handle string or any other type by explicit parsing
    priceValue = parseFloat(String(product.price || 0)) || 0;
  }
  
  // Explicitly handle rating to ensure it's a number
  let ratingValue: number = 0;
  if (typeof product.rating === 'number') {
    ratingValue = product.rating;
  } else if (product.rating) {
    // Only try to parse if it's defined
    ratingValue = parseFloat(String(product.rating)) || 0;
  }
  
  // Explicitly handle review count to ensure it's a number
  let reviewCountValue: number = 0;
  if (typeof product.reviewCount === 'number') {
    reviewCountValue = product.reviewCount;
  } else if (product.reviewCount) {
    // Only try to parse if it's defined
    reviewCountValue = parseInt(String(product.reviewCount), 10) || 0;
  }
  
  return {
    product_id: productId,
    title: product.name,
    price: priceValue,
    description: product.description || "",
    category: product.category,
    retailer: "Amazon via Zinc",
    image: product.image,
    images: product.images || [product.image],
    rating: ratingValue,
    review_count: reviewCountValue,
    brand: product.brand || (product.vendor === "Amazon via Zinc" ? "Amazon" : product.vendor)
  };
};

/**
 * Check if a product is relevant to the search query
 * Used to filter out irrelevant results
 */
export const isProductRelevantToSearch = (product: ZincProduct, searchTerm: string): boolean => {
  const lowercaseSearch = searchTerm.toLowerCase();
  const productTitle = (product.title || "").toLowerCase();
  const productCategory = (product.category || "").toLowerCase();
  const productBrand = (product.brand || "").toLowerCase();
  
  // Clothing/apparel related searches
  const isClothingSearch = lowercaseSearch.includes("hat") || 
                          lowercaseSearch.includes("cap") || 
                          lowercaseSearch.includes("shirt") || 
                          lowercaseSearch.includes("jersey") ||
                          lowercaseSearch.includes("apparel") ||
                          lowercaseSearch.includes("clothing") ||
                          lowercaseSearch.includes("padres");

  // Electronics brands that shouldn't appear in clothing searches
  const electronicsExcludedBrands = [
    "samsung", "sony", "lg", "toshiba", "panasonic", "canon", "nikon", "dell", 
    "hp", "viewsonic", "acer", "asus", "jbl", "bose", "sennheiser"
  ];
  
  // Electronics categories that shouldn't appear in clothing searches
  const electronicsExcludedCategories = [
    "electronics", "headphones", "earbuds", "camera", "computer", "laptop", 
    "monitor", "tv", "television", "audio", "speaker", "phone", "tablet"
  ];
  
  // If this is a clothing search, exclude electronics
  if (isClothingSearch) {
    // Check if this product's category matches any excluded electronics categories
    for (const excludedCategory of electronicsExcludedCategories) {
      if (productCategory.includes(excludedCategory)) {
        console.log(`Filtering out "${product.title}" - clothing search with electronics category: ${productCategory}`);
        return false;
      }
    }
    
    // Check if this product's brand matches any excluded electronics brands
    for (const excludedBrand of electronicsExcludedBrands) {
      if (productBrand.includes(excludedBrand)) {
        console.log(`Filtering out "${product.title}" - clothing search with electronics brand: ${productBrand}`);
        return false;
      }
    }
    
    // If product title mentions specific electronics terms, exclude it
    const electronicsTitleTerms = ["tv", "monitor", "headphone", "earbud", "camera", "laptop", "computer", "speaker"];
    for (const term of electronicsTitleTerms) {
      if (productTitle.includes(term)) {
        console.log(`Filtering out "${product.title}" - clothing search with electronics term in title`);
        return false;
      }
    }
  }
  
  // All checks passed, the product is relevant
  return true;
};
