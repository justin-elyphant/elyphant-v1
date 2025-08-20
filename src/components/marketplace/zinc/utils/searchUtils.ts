
// Re-export all search utilities from the new files
export { findMatchingProducts } from './findMatchingProducts';
export { getImageCategory } from './categoryMapper';
export { correctMisspellings } from './spellingCorrector';
export { createMockResults } from './mockResultsGenerator';
export { generatePrice } from './pricing/priceRanges';
export { getExactProductImage } from './images/productImageUtils';
export { getBrandFromTitle } from './brands/brandUtils';
export { generateTitle } from './titles/titleGenerator';
export { generateDescription } from './descriptions/descriptionGenerator';

// Enhanced search and filtering utilities
export { 
  filterAndSortProductsBrandFirst, 
  generateEnhancedSearchContext 
} from './search/enhancedProductFiltering';
export { 
  applyBrandDiversityFilter, 
  analyzeBrandDistribution 
} from './search/brandDiversityFilter';
export { 
  searchCategoryWithDiversity 
} from './search/enhancedCategorySearch';
export { 
  isProductRelevantToSearch, 
  filterProductsByRelevance 
} from './search/productRelevance';
export { 
  searchMultipleInterests 
} from './search/multiInterestSearch';
