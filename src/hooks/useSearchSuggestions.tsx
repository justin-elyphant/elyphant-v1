
import { useState, useEffect, useMemo } from 'react';
import { useUserSearchHistory } from '@/hooks/useUserSearchHistory';

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'history' | 'suggestion' | 'brand' | 'category';
  popularity?: number;
}

export const useSearchSuggestions = (query: string) => {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { recentSearches } = useUserSearchHistory();

  // Popular search suggestions
  const popularSuggestions = useMemo(() => [
    { text: 'birthday gifts for mom', type: 'suggestion' as const, popularity: 95 },
    { text: 'tech gifts under $100', type: 'suggestion' as const, popularity: 88 },
    { text: 'graduation presents', type: 'suggestion' as const, popularity: 82 },
    { text: 'anniversary gifts for couples', type: 'suggestion' as const, popularity: 78 },
    { text: 'christmas stocking stuffers', type: 'suggestion' as const, popularity: 75 },
    { text: 'wedding shower gifts', type: 'suggestion' as const, popularity: 70 },
    { text: 'baby shower essentials', type: 'suggestion' as const, popularity: 68 },
    { text: 'housewarming gift ideas', type: 'suggestion' as const, popularity: 65 }
  ], []);

  // Popular brands
  const popularBrands = useMemo(() => [
    { text: 'Apple', type: 'brand' as const, popularity: 100 },
    { text: 'Nike', type: 'brand' as const, popularity: 95 },
    { text: 'Samsung', type: 'brand' as const, popularity: 90 },
    { text: 'Lululemon', type: 'brand' as const, popularity: 85 },
    { text: 'Stanley', type: 'brand' as const, popularity: 80 },
    { text: 'Made In', type: 'brand' as const, popularity: 75 },
    { text: 'Lego', type: 'brand' as const, popularity: 70 },
    { text: 'Sony', type: 'brand' as const, popularity: 65 }
  ], []);

  // Popular categories
  const popularCategories = useMemo(() => [
    { text: 'Electronics', type: 'category' as const, popularity: 90 },
    { text: 'Fashion & Accessories', type: 'category' as const, popularity: 85 },
    { text: 'Home & Garden', type: 'category' as const, popularity: 80 },
    { text: 'Sports & Outdoors', type: 'category' as const, popularity: 75 },
    { text: 'Books & Media', type: 'category' as const, popularity: 70 },
    { text: 'Toys & Games', type: 'category' as const, popularity: 65 },
    { text: 'Health & Beauty', type: 'category' as const, popularity: 60 },
    { text: 'Kitchen & Dining', type: 'category' as const, popularity: 55 }
  ], []);

  useEffect(() => {
    if (!query || query.length < 2) {
      // Show recent searches and popular suggestions when no query
      const recentSuggestions: SearchSuggestion[] = recentSearches.slice(0, 3).map((search, index) => ({
        id: `recent-${index}`,
        text: search,
        type: 'history',
        popularity: 100 - index * 5
      }));

      const topSuggestions = popularSuggestions.slice(0, 5).map((suggestion, index) => ({
        id: `suggestion-${index}`,
        ...suggestion
      }));

      setSuggestions([...recentSuggestions, ...topSuggestions]);
      return;
    }

    setIsLoading(true);
    
    // Simulate API delay for realistic UX
    const timeoutId = setTimeout(() => {
      const queryLower = query.toLowerCase();
      
      // Filter and score suggestions
      const filteredSuggestions: SearchSuggestion[] = [];
      
      // Recent searches matching query
      recentSearches
        .filter(search => search.toLowerCase().includes(queryLower))
        .slice(0, 2)
        .forEach((search, index) => {
          filteredSuggestions.push({
            id: `recent-${index}`,
            text: search,
            type: 'history',
            popularity: 100
          });
        });

      // Popular suggestions matching query
      popularSuggestions
        .filter(suggestion => suggestion.text.toLowerCase().includes(queryLower))
        .slice(0, 3)
        .forEach((suggestion, index) => {
          filteredSuggestions.push({
            id: `suggestion-${index}`,
            ...suggestion
          });
        });

      // Brands matching query
      popularBrands
        .filter(brand => brand.text.toLowerCase().includes(queryLower))
        .slice(0, 2)
        .forEach((brand, index) => {
          filteredSuggestions.push({
            id: `brand-${index}`,
            ...brand
          });
        });

      // Categories matching query
      popularCategories
        .filter(category => category.text.toLowerCase().includes(queryLower))
        .slice(0, 2)
        .forEach((category, index) => {
          filteredSuggestions.push({
            id: `category-${index}`,
            ...category
          });
        });

      // Sort by popularity and limit results
      const sortedSuggestions = filteredSuggestions
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        .slice(0, 8);

      setSuggestions(sortedSuggestions);
      setIsLoading(false);
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [query, recentSearches, popularSuggestions, popularBrands, popularCategories]);

  return {
    suggestions,
    isLoading
  };
};

export const useEnhancedSearchSuggestions = useSearchSuggestions;
