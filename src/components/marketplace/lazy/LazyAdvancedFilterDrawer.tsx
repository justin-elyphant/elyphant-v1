
import { createLazyComponent } from '@/utils/lazyLoading';

// Lazy load the filter drawer for better performance
export const LazyAdvancedFilterDrawer = createLazyComponent(
  () => import('../filters/AdvancedFilterDrawer'),
  false
);

export default LazyAdvancedFilterDrawer;
