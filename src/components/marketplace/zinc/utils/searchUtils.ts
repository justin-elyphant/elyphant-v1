/**
 * Search utilities - simplified after cleanup
 * Only exports active utilities used by the application
 */

// Brand diversity filtering for search results
export { 
  applyBrandDiversityFilter, 
  analyzeBrandDistribution 
} from './search/brandDiversityFilter';

// Multi-interest search for diversified results
export { 
  searchMultipleInterests 
} from './search/multiInterestSearch';
