import React from 'react';
import { createBoundedMemoization } from '@/utils/performanceOptimizations';

// Optimized lazy loading for UnifiedProductCard
const LazyUnifiedProductCard = React.lazy(() => 
  import('@/components/marketplace/UnifiedProductCard')
);

// Memoized product formatting utilities
const formatProductPrice = createBoundedMemoization((price: number) => {
  let actualPrice = price;
  if (Number.isInteger(price) && price > 500) {
    const dollarPrice = price / 100;
    if (dollarPrice >= 5 && dollarPrice <= 10000) {
      actualPrice = dollarPrice;
    }
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(actualPrice);
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