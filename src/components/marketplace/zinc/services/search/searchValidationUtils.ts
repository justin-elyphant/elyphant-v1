
/**
 * Utilities for validating and enhancing search queries
 */
import { correctMisspellings } from "../../utils/spellingCorrector";
import { addCategoryHints } from "../../utils/termMapper";

/**
 * Validates and normalizes a search query
 * @returns cleaned query or null if invalid
 */
export const validateSearchQuery = (query: string | undefined): string | null => {
  // Handle empty queries
  if (!query || query.trim() === "") {
    console.warn("Empty search query provided");
    return null;
  }
  
  // Clean up and normalize the query
  return query.trim().toLowerCase();
};

/**
 * Enhances a search query with category hints and spelling corrections
 */
export const enhanceSearchQuery = (query: string): string => {
  // Add category hints to improve search relevance
  const enhancedQuery = addCategoryHints(query);
  
  if (enhancedQuery !== query) {
    console.log(`Enhanced search query from "${query}" to "${enhancedQuery}"`);
  }
  
  return enhancedQuery;
};

/**
 * Apply spelling correction to a search query
 */
export const correctSearchQuery = (query: string): string => {
  // Try with spelling correction
  const correctedQuery = correctMisspellings(query);
  
  if (correctedQuery !== query) {
    console.log(`Applying spelling correction: "${query}" to "${correctedQuery}"`);
  }
  
  return correctedQuery;
};

/**
 * Handles special case for Padres hat searches
 */
export const getPadresHatQuery = (normalizedQuery: string): string | null => {
  // Special case for Padres hat searches - force clothing category
  if ((normalizedQuery.includes("padres") || normalizedQuery.includes("san diego")) && 
      (normalizedQuery.includes("hat") || normalizedQuery.includes("cap"))) {
    const enhancedQuery = "san diego padres baseball hat clothing apparel";
    console.log(`Special case search: Using query "${enhancedQuery}" for Padres hat search`);
    return enhancedQuery;
  }
  
  return null;
};
