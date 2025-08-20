import React from 'react';
import { createBoundedMemoization } from '@/utils/performanceOptimizations';
import { formatPrice } from '@/lib/utils';

// Optimized lazy loading for UnifiedProductCard
const LazyUnifiedProductCard = React.lazy(() => 
  import('@/components/marketplace/UnifiedProductCard')
);

// Memoized product formatting utilities - now using unified pricing
const formatProductPrice = createBoundedMemoization((price: number, productSource?: 'zinc_api' | 'shopify' | 'vendor_portal' | 'manual', skipCentsDetection?: boolean) => {
  return formatPrice(price, { productSource, skipCentsDetection });
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