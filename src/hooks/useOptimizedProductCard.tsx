import React from 'react';
import { createBoundedMemoization } from '@/utils/performanceOptimizations';

// Optimized lazy loading for UnifiedProductCard
const LazyUnifiedProductCard = React.lazy(() => 
  import('@/components/marketplace/UnifiedProductCard')
);

// Memoized product formatting utilities
const formatProductPrice = createBoundedMemoization((price: number) => {
  // Zinc API returns prices in dollars, format directly
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price);
});

const formatRating = createBoundedMemoization((rating: number) => {
  return Math.round(rating * 10) / 10;
});

export const useOptimizedProductCard = () => {
  return {
    LazyUnifiedProductCard,
    formatProductPrice,
    formatRating
  };
};