import { useMemo } from 'react';

/**
 * Hook to intelligently group search results based on search term and results data
 */
export const useResultGrouping = (searchTerm: string, zincResults: any[]) => {
  // Group results based on search term and content
  const groupedResults = useMemo(() => {
    // Sort products by rating/review count to identify top sellers
    const sortedZincResults = [...zincResults].sort((a, b) => {
      const aScore = (a.rating || 0) * (a.review_count || a.reviewCount || 0);
      const bScore = (b.rating || 0) * (b.review_count || b.reviewCount || 0);
      return bScore - aScore;
    });
    
    // Identify top sellers (top 30% of results)
    const topSellerCount = Math.max(1, Math.ceil(sortedZincResults.length * 0.3));
    const topSellers = sortedZincResults.slice(0, topSellerCount);
    const otherProducts = sortedZincResults.slice(topSellerCount);

    // Group search results by type for Apple MacBook searches
    if (searchTerm.toLowerCase().includes('macbook')) {
      // Filter for actual Apple products
      const appleProducts = sortedZincResults.filter(product => 
        (product.title?.toLowerCase().includes('apple') && product.title?.toLowerCase().includes('macbook')) ||
        (product.brand?.toLowerCase() === 'apple')
      );
      
      // Other brand products
      const otherBrandProducts = sortedZincResults.filter(product => 
        !(product.title?.toLowerCase().includes('apple') && product.title?.toLowerCase().includes('macbook')) &&
        product.brand?.toLowerCase() !== 'apple'
      );
      
      return {
        appleProducts,
        otherBrandProducts
      };
    }
    
    // For sports merchandise searches
    if (searchTerm.toLowerCase().includes('padres') && 
        (searchTerm.toLowerCase().includes('hat') || searchTerm.toLowerCase().includes('cap'))) {
      // Filter for actual hats/caps
      const actualHats = sortedZincResults.filter(product => 
        product.category?.toLowerCase().includes('clothing') || 
        product.title?.toLowerCase().includes('hat') || 
        product.title?.toLowerCase().includes('cap')
      );
      
      // Other products
      const otherProducts = sortedZincResults.filter(product => 
        !(product.category?.toLowerCase().includes('clothing') || 
          product.title?.toLowerCase().includes('hat') || 
          product.title?.toLowerCase().includes('cap'))
      );
      
      return {
        actualHats,
        otherProducts: otherProducts.length > 0 ? otherProducts : []
      };
    }
    
    // Default grouping
    return {
      topSellers,
      otherProducts
    };
  }, [searchTerm, zincResults]);

  return {
    groupedResults
  };
};
