
import { createLazyComponent } from '@/utils/lazyLoading';

// Lazy load the entire checkout flow
export const LazyCheckoutPage = createLazyComponent(
  () => import('../checkout/CheckoutPage'),
  false
);

export default LazyCheckoutPage;
