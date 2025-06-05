
import { lazy } from 'react';
import { createLazyComponent } from '@/utils/lazyLoading';

// Lazy load the heavy ProductDetailsDialog component
export const LazyProductDetailsDialog = createLazyComponent(
  () => import('../ProductDetailsDialog'),
  false // Don't preload unless needed
);

export default LazyProductDetailsDialog;
