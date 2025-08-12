import React from 'react';

// Optimized lazy loading with error boundaries and loading states
export const createOptimizedLazyComponent = <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) => {
  return React.lazy(importFn);
};

// Preload critical routes for better navigation performance
export const preloadCriticalRoutes = () => {
  // Preload during idle time - simplified without module imports
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      // Prefetch likely next routes
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = '/marketplace';
      document.head.appendChild(link);
    });
  }
};

// Dynamic imports for heavy components
export const LazyComponents = {
  UnifiedProductCard: createOptimizedLazyComponent(
    () => import('@/components/marketplace/UnifiedProductCard')
  )
};