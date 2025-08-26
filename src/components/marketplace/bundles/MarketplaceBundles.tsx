/**
 * Bundle splitting configuration for marketplace components
 */

// Lazy load marketplace components for better initial load performance
import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Core marketplace components - loaded immediately
export { default as MarketplaceHeader } from '../MarketplaceHeader';
export { default as MarketplaceQuickFilters } from '../MarketplaceQuickFilters';

// Heavy components - lazy loaded
export const LazyStreamlinedMarketplaceWrapper = lazy(() => 
  import('../StreamlinedMarketplaceWrapper')
);

export const LazyProductDetailsDialog = lazy(() => 
  import('../ProductDetailsDialog')
);

export const LazyAirbnbStyleCategorySections = lazy(() => 
  import('../AirbnbStyleCategorySections').then(module => ({
    default: module.AirbnbStyleCategorySections
  }))
);

export const LazyVirtualizedProductGrid = lazy(() => 
  import('../components/VirtualizedProductGrid')
);

export const LazyOptimizedProductGrid = lazy(() => 
  import('../components/OptimizedProductGrid')
);

// Search components - lazy loaded
export const LazyAIEnhancedSearchBar = lazy(() => 
  import('@/components/search/AIEnhancedSearchBar')
);

// Category components - lazy loaded
export const LazyBrandHeroSection = lazy(() => 
  import('../BrandHeroSection')
);

export const LazyCategoryHeroSection = lazy(() => 
  import('../CategoryHeroSection')
);

// Loading components for better UX
export const MarketplaceComponentSkeleton = () => (
  <div className="container mx-auto px-4 py-6">
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      
      {/* Filters skeleton */}
      <div className="flex gap-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
      
      {/* Grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="space-y-3">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const ProductGridSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {Array.from({ length: 12 }).map((_, index) => (
      <div key={index} className="space-y-3">
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    ))}
  </div>
);

export const SearchBarSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-12 w-full rounded-lg" />
    <div className="flex gap-2">
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-8 w-20" />
    </div>
  </div>
);

// Wrapper component with Suspense
export const MarketplaceBundleWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<MarketplaceComponentSkeleton />}>
    {children}
  </Suspense>
);

export const ProductGridBundleWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<ProductGridSkeleton />}>
    {children}
  </Suspense>
);

export const SearchBundleWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<SearchBarSkeleton />}>
    {children}
  </Suspense>
);

// Preload functions for better perceived performance
export const preloadMarketplaceComponents = () => {
  // Preload critical components when user hovers over marketplace links
  import('../StreamlinedMarketplaceWrapper');
  import('../components/OptimizedProductGrid');
};

export const preloadSearchComponents = () => {
  import('@/components/search/AIEnhancedSearchBar');
};

export const preloadProductComponents = () => {
  import('../ProductDetailsDialog');
  import('../components/VirtualizedProductGrid');
};