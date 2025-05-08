
import { useMemo } from 'react';
import { findMappedTerm } from '@/components/marketplace/zinc/utils/termMapper';

/**
 * Hook to provide intelligent search suggestions
 * based on the current search term
 */
export const useSearchSuggestions = (searchTerm: string) => {
  // Generate search suggestion based on the current term
  const searchSuggestion = useMemo(() => {
    if (!searchTerm || searchTerm.trim().length < 2) return "";
    
    const term = searchTerm.toLowerCase().trim();
    
    // First check for term mappings from our utility
    const mappedTerm = findMappedTerm(term);
    if (mappedTerm) return mappedTerm;
    
    // Enhanced suggestions based on partial matches
    const suggestions: Record<string, string> = {
      "n": "nike shoes",
      "ni": "nike shoes",
      "nik": "nike shoes",
      "nike": "nike shoes",
      "nike s": "nike shoes",
      "nike sh": "nike shoes",
      "nike sho": "nike shoes",
      "d": "dallas cowboys",
      "da": "dallas cowboys",
      "dal": "dallas cowboys",
      "ip": "iphone",
      "iph": "iphone",
      "s": "samsung galaxy",
      "sa": "samsung galaxy",
      "sam": "samsung galaxy",
      "p": "playstation",
      "pl": "playstation",
      "x": "xbox",
      "xb": "xbox",
      "he": "headphones",
      "hea": "headphones",
      "wat": "apple watch",
      "pad": "ipad",
      "mac": "apple macbook",
      "san": "san diego padres",
      "san d": "san diego padres",
      "san di": "san diego padres",
      "padr": "san diego padres hat",
      "can": "scented candle",
      "47": "47 brand cap",
      "47 b": "47 brand cap"
    };
    
    if (suggestions[term]) {
      return suggestions[term];
    }
    
    return searchTerm;
  }, [searchTerm]);

  return {
    searchSuggestion
  };
};
