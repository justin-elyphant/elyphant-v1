/**
 * useSearchSuggestions - Re-exports useSearchSuggestionsLive for backward compatibility
 * 
 * This file previously contained 140+ lines of mock data.
 * Now consolidated to use the real search-suggestions edge function.
 */

export { 
  useSearchSuggestionsLive as useSearchSuggestions,
  useSearchSuggestionsLive as useEnhancedSearchSuggestions,
  type SearchSuggestion,
  type ProductSuggestion,
  type SearchSuggestionsResult
} from './useSearchSuggestionsLive';
