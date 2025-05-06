import { ZincProduct } from "../types";
import { Product, normalizeProduct } from "@/contexts/ProductContext";

/**
 * Parse a product ID string into a number with fallback
 */
const parseProductId = (productIdString: string | undefined): string => {
  // If undefined, return a random ID
  if (!productIdString) {
    console.log("Missing product_id, generating random ID");
    return `rand-${Math.floor(Math.random() * 100000)}`;
  }
  
  return String(productIdString);
};

/**
 * Convert a Zinc product to our Product format
 */
export const convertZincProductToProduct = (zincProduct: ZincProduct): Product => {
  // Log data source for debugging
  console.log(`Converting Zinc product: ${zincProduct.title} (${zincProduct.product_id})`);
  
  // IMPORTANT: Validate and clean up the image URLs
  // Check if image is valid (not null or undefined)
  let productImage = "/placeholder.svg";
  let productImages: string[] = [];
  
  // First try to use images array
  if (zincProduct.images && Array.isArray(zincProduct.images) && zincProduct.images.length > 0) {
    // Filter out any null or undefined values
    const validImages = zincProduct.images.filter(img => img && typeof img === 'string');
    if (validImages.length > 0) {
      productImages = validImages;
      productImage = validImages[0];
    }
  } 
  // Fallback to single image if images array is empty
  if (productImages.length === 0 && zincProduct.image && typeof zincProduct.image === 'string') {
    productImage = zincProduct.image;
    productImages = [zincProduct.image];
  }
  
  // If we still have no valid images, use fallback
  if (productImages.length === 0) {
    // For Padres or baseball merchandise, use a relevant image
    if (zincProduct.title && 
        (zincProduct.title.toLowerCase().includes('padres') || 
         zincProduct.title.toLowerCase().includes('baseball') || 
         zincProduct.title.toLowerCase().includes('hat'))) {
      productImage = 'https://images.unsplash.com/photo-1590075865003-e48b276c4579?w=500&h=500&fit=crop';
    } else {
      productImage = '/placeholder.svg';
    }
    productImages = [productImage];
    console.warn(`No valid images for product: ${zincProduct.title}, using fallback`);
  }
  
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
  const productId = parseProductId(zincProduct.product_id);
  
  // Log data consistency issues for debugging
  if (!productImage || productImage === '/placeholder.svg') {
    console.warn(`No valid image for product: ${zincProduct.title} (${zincProduct.product_id})`);
  }
  
  if (priceValue > 1000) {
    console.warn(`Unusually high price for ${zincProduct.title}: $${priceValue}`);
  }
  
  // Using our normalizeProduct function to ensure consistent structure
  return normalizeProduct({
    product_id: productId,
    id: productId,
    title: zincProduct.title,
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
  });
};

/**
 * Convert our Product format back to a Zinc product
 */
export const convertProductToZincProduct = (product: Product): ZincProduct => {
  // For product_id, ensure we have a string (force conversion)
  const productId = String(product.product_id);
  
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
    title: product.title || product.name || '',
    price: priceValue,
    description: product.description || "",
    category: product.category || '',
    retailer: "Amazon via Zinc",
    image: product.image || '',
    images: product.images || [product.image || ''],
    rating: ratingValue,
    review_count: reviewCountValue,
    brand: product.brand || (product.vendor === "Amazon via Zinc" ? "Amazon" : product.vendor || '')
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
  const productDescription = (product.description || "").toLowerCase();
  
  // Planter/garden search filtering
  const searchPlanter = lowercaseSearch.includes("planter") || 
                        lowercaseSearch.includes("pot") || 
                        lowercaseSearch.includes("garden");
                        
  if (searchPlanter) {
    // Electronics categories should be excluded from planter searches
    const electronicsCategories = [
      "electronics", "computer", "laptop", "camera", "phone", 
      "tablet", "monitor", "tv", "television", "headphone", 
      "speaker", "audio"
    ];
    
    // Check if product category matches any electronics categories
    for (const category of electronicsCategories) {
      if (productCategory.includes(category) || 
          productTitle.includes(category + " ") ||
          (productTitle.includes("sony") && !productTitle.includes("garden")) ||
          (productTitle.includes("apple") && !productTitle.includes("garden")) ||
          (productTitle.includes("hp") && !productTitle.includes("garden")) ||
          (productTitle.includes("dell") && !productTitle.includes("garden")) ||
          (productTitle.includes("bose") && !productTitle.includes("garden"))) {
        console.log(`Filtering out "${product.title}" - planter search with electronics category: ${productCategory}`);
        return false;
      }
    }
    
    // If not explicitly mentioned as a planter/garden item in title or description, exclude
    const gardenTerms = ["planter", "pot", "garden", "plant", "flower", "outdoor", "patio"];
    
    // Check if the product contains any garden-related terms
    const hasGardenTerm = gardenTerms.some(term => 
      productTitle.includes(term) || 
      productCategory.includes(term) ||
      productDescription.includes(term)
    );
    
    if (!hasGardenTerm) {
      console.log(`Filtering out "${product.title}" - planter search but product doesn't appear to be garden-related`);
      return false;
    }
  }
  
  // Check for hat searches
  const searchHat = lowercaseSearch.includes("hat") || lowercaseSearch.includes("cap");
  const searchPadres = lowercaseSearch.includes("padres") || lowercaseSearch.includes("san diego");
  const searchTeam = searchPadres || lowercaseSearch.includes("team") || lowercaseSearch.includes("baseball");
  
  // Stronger clothing and hat search filtering
  if (searchHat) {
    // Electronics and non-clothing/hat categories should be excluded
    if (productCategory.includes("electronics") || 
        productCategory.includes("computer") ||
        productCategory.includes("camera") ||
        productCategory.includes("phone") ||
        productCategory.includes("tablet") ||
        productCategory.includes("monitor") ||
        productCategory.includes("speaker") ||
        productCategory.includes("headphone") ||
        productCategory.includes("tv")) {
      console.log(`Filtering out "${product.title}" - hat search with electronics category: ${productCategory}`);
      return false;
    }
    
    // If not explicitly mentioned as a hat in title or description, exclude
    if (!(productTitle.includes("hat") || productTitle.includes("cap") || 
          productCategory.includes("hat") || productCategory.includes("cap") ||
          productDescription.includes("hat") || productDescription.includes("cap"))) {
      console.log(`Filtering out "${product.title}" - hat search but product doesn't appear to be a hat`);
      return false;
    }
  }
  
  // Team merchandise search filtering
  if (searchPadres || searchTeam) {
    // Electronics brands that shouldn't appear in team merchandise searches
    const electronicsExcludedBrands = [
      "samsung", "sony", "lg", "toshiba", "panasonic", "canon", "nikon", "dell", 
      "hp", "viewsonic", "acer", "asus", "jbl", "bose", "sennheiser"
    ];
    
    // If this is a team merchandise search, first check if the product actually mentions the team
    if (searchPadres && 
        !productTitle.includes("padres") && 
        !productTitle.includes("san diego") && 
        !productDescription.includes("padres") && 
        !productDescription.includes("san diego")) {
      console.log(`Filtering out "${product.title}" - padres search but product doesn't mention padres`);
      return false;
    }
    
    // Check if this product's brand matches any excluded electronics brands
    for (const excludedBrand of electronicsExcludedBrands) {
      if (productBrand.includes(excludedBrand)) {
        console.log(`Filtering out "${product.title}" - team merchandise search with electronics brand: ${productBrand}`);
        return false;
      }
    }
  }
  
  // If we have a null image, the product is not useful to display
  if (!product.image) {
    console.log(`Filtering out "${product.title}" - missing image`);
    return false;
  }
  
  // All checks passed, the product is relevant
  return true;
};
