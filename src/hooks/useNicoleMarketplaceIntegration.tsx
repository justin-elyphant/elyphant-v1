import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { directNicoleMarketplaceService } from '@/services/marketplace/DirectNicoleMarketplaceService';
import { Product } from '@/contexts/ProductContext';

/**
 * **PHASE 1: Nicole → Marketplace Integration Hook**
 * Manages the complete integration between Nicole AI and marketplace
 * Handles context persistence, URL parameters, and direct API calls
 */
export const useNicoleMarketplaceIntegration = () => {
  const [searchParams] = useSearchParams();
  const [nicoleContext, setNicoleContext] = useState<any>(null);
  const [isNicoleSearch, setIsNicoleSearch] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // **PHASE 7: Context Persistence Detection**
  useEffect(() => {
    const source = searchParams.get('source');
    setIsNicoleSearch(source === 'nicole');

    if (source === 'nicole') {
      console.log('🎯 NicoleIntegration: Detected Nicole search, loading context');
      
      // **PHASE 7: Multi-source Context Loading**
      let context = directNicoleMarketplaceService.retrieveNicoleContext();
      
      // If no stored context, construct from URL
      if (!context) {
        console.log('🎯 NicoleIntegration: No stored context, constructing from URL');
        context = constructContextFromURL();
      }
      
      setNicoleContext(context);
      console.log('🎯 NicoleIntegration: Nicole context loaded:', context);
    }
  }, [searchParams]);

  // **PHASE 1: Direct API Search with Nicole Context**
  const executeNicoleSearch = async (query: string, context?: any) => {
    if (!query) return;

    setIsLoading(true);
    console.log('🎯 NicoleIntegration: Executing search with context:', { query, context });

    try {
      const searchContext = context || nicoleContext;
      
      if (searchContext) {
        // **PHASE 1: Direct Nicole API Call**
        const results = await directNicoleMarketplaceService.searchWithNicoleContext(
          query,
          searchContext,
          { maxResults: 35 }
        );

        console.log(`🎯 NicoleIntegration: Found ${results.length} products`);
        setProducts(results);
        return results;
      } else {
        console.warn('🎯 NicoleIntegration: No Nicole context available for search');
        return [];
      }
    } catch (error) {
      console.error('🎯 NicoleIntegration: Search failed:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // **PHASE 7: URL Context Construction**
  const constructContextFromURL = () => {
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const interests = searchParams.get('interests');
    const recipient = searchParams.get('recipient');
    const occasion = searchParams.get('occasion');

    return {
      budget: minPrice && maxPrice ? [parseFloat(minPrice), parseFloat(maxPrice)] : undefined,
      interests: interests ? interests.split(',') : [],
      recipient: recipient || undefined,
      occasion: occasion || undefined,
      conversationPhase: 'presenting_results',
      capability: 'search',
      source: 'url-params'
    };
  };

  // **PHASE 8: Budget Information Extraction**
  const getBudgetInfo = () => {
    if (!nicoleContext?.budget) return null;
    
    const budget = Array.isArray(nicoleContext.budget) 
      ? { min: nicoleContext.budget[0], max: nicoleContext.budget[1] }
      : nicoleContext.budget;
      
    return budget;
  };

  // **PHASE 8: Search Query Enhancement**
  const enhanceSearchQuery = (originalQuery: string) => {
    if (!nicoleContext) return originalQuery;

    let enhanced = originalQuery;

    // Add interests to query
    if (nicoleContext.interests?.length > 0) {
      enhanced += ` ${nicoleContext.interests.join(' ')}`;
    }

    // Add recipient context
    if (nicoleContext.recipient) {
      enhanced += ` for ${nicoleContext.recipient}`;
    }

    // Add occasion context
    if (nicoleContext.occasion) {
      enhanced += ` ${nicoleContext.occasion}`;
    }

    console.log(`🎯 NicoleIntegration: Enhanced query: "${originalQuery}" → "${enhanced}"`);
    return enhanced;
  };

  // **PHASE 9: Context Validation**
  const validateNicoleContext = (context: any) => {
    if (!context) return false;

    // Check if context is recent (within 1 hour)
    const isRecent = context.timestamp && (Date.now() - context.timestamp < 3600000);
    
    // Check if context has essential data
    const hasEssentialData = context.budget || context.interests?.length > 0 || context.recipient;

    return isRecent && hasEssentialData;
  };

  return {
    // State
    nicoleContext,
    isNicoleSearch,
    products,
    isLoading,

    // Actions
    executeNicoleSearch,
    enhanceSearchQuery,
    
    // Utilities
    getBudgetInfo,
    validateNicoleContext,
    
    // Context Management
    updateNicoleContext: setNicoleContext,
    storeNicoleContext: directNicoleMarketplaceService.storeNicoleContext.bind(directNicoleMarketplaceService),
    retrieveNicoleContext: directNicoleMarketplaceService.retrieveNicoleContext.bind(directNicoleMarketplaceService)
  };
};