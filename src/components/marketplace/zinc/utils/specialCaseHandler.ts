
import { ZincProduct } from '../types';
import { createMockResults } from './mockResultsGenerator';

/**
 * Handle special cases for certain search queries
 */
export const handleSpecialCases = (query: string): ZincProduct[] | null => {
  const lowercaseQuery = query.toLowerCase();
  
  // Special case for Padres hat searches
  if ((lowercaseQuery.includes("padres") || lowercaseQuery.includes("san diego")) && 
      (lowercaseQuery.includes("hat") || lowercaseQuery.includes("cap"))) {
    return createMockResults(
      "San Diego Padres Baseball Hat", 
      "Baseball Team Merchandise", 
      15, 
      4.0, 
      5.0, 
      "San Diego Padres", 
      true
    );
  }
  
  // Special case for planter searches
  if (lowercaseQuery.includes("planter") || 
      (lowercaseQuery.includes("pot") && 
      (lowercaseQuery.includes("garden") || lowercaseQuery.includes("plant") || lowercaseQuery.includes("flower")))) {
    return createPlanterResults(lowercaseQuery);
  }
  
  // Special case for garden searches
  if (lowercaseQuery.includes("garden") && 
      !lowercaseQuery.includes("electronics") && 
      !lowercaseQuery.includes("headphones")) {
    return createPlanterResults(lowercaseQuery);
  }
  
  // No special case needed
  return null;
};

/**
 * Get special case products - wrapper around handleSpecialCases for better API naming
 */
export const getSpecialCaseProducts = async (query: string): Promise<ZincProduct[] | null> => {
  // This is a wrapper function that makes the handleSpecialCases function async
  // to match the expected signature in productSearchService
  return handleSpecialCases(query);
};

/**
 * Create planter-specific mock results
 */
const createPlanterResults = (query: string): ZincProduct[] => {
  // Determine if this is an outdoor specific query
  const isOutdoor = query.includes("outdoor") || query.includes("patio");
  const baseCategory = isOutdoor ? "Outdoor Garden Planters" : "Garden Planters";
  
  const planterResults = createMockResults(
    isOutdoor ? "Outdoor Garden Planter" : "Garden Planter",
    baseCategory,
    20,
    4.2,
    4.9,
    undefined,
    true
  );
  
  // Enhance with planter-specific attributes
  return planterResults.map(product => {
    // Ensure planter-specific titles
    if (!product.title?.toLowerCase().includes("planter")) {
      product.title = generatePlanterTitle(query, isOutdoor);
    }
    
    // Set specific planter category
    product.category = baseCategory;
    
    // Add planter-specific brands
    product.brand = getPlanterBrand();
    
    // Set appropriate planter images
    product.image = getPlanterImage(isOutdoor);
    product.images = [product.image];
    
    // Add planter description
    product.description = generatePlanterDescription(product.title, isOutdoor);
    
    return product;
  });
};

/**
 * Generate appropriate planter titles
 */
const generatePlanterTitle = (query: string, isOutdoor: boolean): string => {
  const prefixes = isOutdoor ? 
    ["Outdoor", "Patio", "Garden", "Deck", "Balcony"] : 
    ["Indoor", "Home", "Decorative", "Modern", "Ceramic"];
    
  const materials = isOutdoor ?
    ["Plastic", "Terracotta", "Concrete", "Resin", "Metal", "Stone", "Wood"] :
    ["Ceramic", "Clay", "Porcelain", "Glass", "Metal", "Wooden"];
    
  const types = ["Planter", "Pot", "Planter Box", "Plant Container", "Flower Pot"];
  const sizes = ["Large", "Medium", "Small", "10-inch", "12-inch", "Set of 3"];
  
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const material = materials[Math.floor(Math.random() * materials.length)];
  const type = types[Math.floor(Math.random() * types.length)];
  const size = sizes[Math.floor(Math.random() * sizes.length)];
  
  return `${prefix} ${size} ${material} ${type} for Plants`;
};

/**
 * Get planter-specific brands
 */
const getPlanterBrand = (): string => {
  const brands = [
    "Bloem", "Mkono", "La Jolie Muse", "Kante", "Novelty", 
    "Southern Patio", "Gardenix Decor", "Classic Garden", 
    "Plant Buddies", "Terrain", "Costa Farms", "Greenery Unlimited"
  ];
  
  return brands[Math.floor(Math.random() * brands.length)];
};

/**
 * Get planter-specific images
 */
const getPlanterImage = (isOutdoor: boolean): string => {
  const outdoorPlanterImages = [
    "https://images.unsplash.com/photo-1596521884071-39833e7ba6a6?w=500&h=500&fit=crop",
    "https://images.unsplash.com/photo-1623320976222-2e4ffa56a198?w=500&h=500&fit=crop",
    "https://images.unsplash.com/photo-1623310922825-954679412f4c?w=500&h=500&fit=crop",
    "https://images.unsplash.com/photo-1620803222629-1fe4239b6394?w=500&h=500&fit=crop",
    "https://images.unsplash.com/photo-1628768709591-f0c5928f7a31?w=500&h=500&fit=crop"
  ];
  
  const indoorPlanterImages = [
    "https://images.unsplash.com/photo-1628929141148-760a004c8fa8?w=500&h=500&fit=crop",
    "https://images.unsplash.com/photo-1604762512526-b7068fe9474a?w=500&h=500&fit=crop",
    "https://images.unsplash.com/photo-1637520419769-52a740a3c55a?w=500&h=500&fit=crop",
    "https://images.unsplash.com/photo-1524055530917-50e8e2c1d9a9?w=500&h=500&fit=crop",
    "https://images.unsplash.com/photo-1622122201714-77da0ca9e9b9?w=500&h=500&fit=crop"
  ];
  
  const imageArray = isOutdoor ? outdoorPlanterImages : indoorPlanterImages;
  return imageArray[Math.floor(Math.random() * imageArray.length)];
};

/**
 * Generate planter-specific descriptions
 */
const generatePlanterDescription = (title: string, isOutdoor: boolean): string => {
  const outdoorFeatures = [
    "Weather-resistant", "Durable in all seasons", "UV protected", 
    "Drainage holes included", "Frost-resistant", "Perfect for patios and decks"
  ];
  
  const indoorFeatures = [
    "Elegant design", "Perfect for home decor", "Drainage tray included", 
    "Non-marking base", "Enhances any room", "Perfect for succulents and small plants"
  ];
  
  const features = isOutdoor ? outdoorFeatures : indoorFeatures;
  const randomFeatures = features.sort(() => 0.5 - Math.random()).slice(0, 3);
  
  return `${title}. ${randomFeatures.join('. ')}. Adds beauty to your ${isOutdoor ? 'outdoor' : 'indoor'} space while providing a healthy environment for your plants.`;
};

/**
 * Create mapped term results
 */
export const createResultsForMappedTerm = (mappedTerm: string): ZincProduct[] | null => {
  // Handle planter searches with the mapped term
  if (mappedTerm.includes("planter") || mappedTerm.includes("garden")) {
    return createPlanterResults(mappedTerm);
  }
  
  // Default behavior - let the standard search handle it
  return null;
};
