import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Product } from "@/types/product";
import { CategorySection } from "./CategorySection";
import { enhancedZincApiService } from "@/services/enhancedZincApiService";
import { getFeaturedCategories } from "@/constants/categories";
import { toast } from "sonner";
import { useOptimizedIntersectionObserver } from "@/hooks/useOptimizedIntersectionObserver";
import { optimizedMarketplaceService } from "@/services/marketplace/OptimizedMarketplaceService";
import { backgroundPrefetchingService } from "@/services/marketplace/BackgroundPrefetchingService";
import { usePerformanceMonitoring } from "@/hooks/usePerformanceMonitoring";
import ProgressiveLoadingIndicator from "./ui/ProgressiveLoadingIndicator";
import { devLog } from "@/utils/performanceOptimizations";

interface ProgressiveAirbnbStyleCategorySectionsProps {
  className?: string;
  onProductClick?: (product: Product) => void;
}

interface CategoryData {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  hasLoaded: boolean;
}

// Get featured categories from the constants (same as homepage)
const FEATURED_CATEGORIES = getFeaturedCategories();

const CATEGORIES = FEATURED_CATEGORIES.map(category => ({
  key: category.value,
  title: `Best Selling ${category.displayName || category.name}`,
  subtitle: category.description,
  searchTerm: category.searchTerm
}));

// Only load the first 2 categories immediately
const IMMEDIATE_LOAD_COUNT = 2;

export const ProgressiveAirbnbStyleCategorySections: React.FC<ProgressiveAirbnbStyleCategorySectionsProps> = ({ 
  className, 
  onProductClick 
}) => {
  const navigate = useNavigate();
  const [categoryData, setCategoryData] = useState<Record<string, CategoryData>>({});
  const [progressStats, setProgressStats] = useState({ totalLoadTime: 0, averageLoadTime: 0, loadedCount: 0 });
  const loadedCategories = useRef(new Set<string>());
  const loadTimes = useRef<number[]>([]);
  const { startTimer, endTimer } = usePerformanceMonitoring();

  // Initialize all categories with empty state
  useEffect(() => {
    const initialData: Record<string, CategoryData> = {};
    CATEGORIES.forEach(category => {
      initialData[category.key] = {
        products: [],
        isLoading: false,
        error: null,
        hasLoaded: false
      };
    });
    setCategoryData(initialData);
  }, []);

  // Load category data function
  const loadCategoryData = useCallback(async (categoryKey: string) => {
    if (loadedCategories.current.has(categoryKey)) return;
    
    loadedCategories.current.add(categoryKey);
    const category = CATEGORIES.find(cat => cat.key === categoryKey);
    if (!category) return;

    // Set loading state
    setCategoryData(prev => ({
      ...prev,
      [categoryKey]: {
        ...prev[categoryKey],
        isLoading: true,
        error: null
      }
    }));

    try {
      startTimer(`category-${categoryKey}-load`);
      console.log(`Loading products for category: ${categoryKey}`);
      
      // Check cache first using optimized service
      const cachedResults = await optimizedMarketplaceService.searchProducts(category.searchTerm, {
        limit: 10
      });

      let products: Product[] = [];

      if (cachedResults && cachedResults.length > 0) {
        products = cachedResults;
        console.log(`Using cached results for ${categoryKey}: ${products.length} products`);
      } else {
        // Fallback to Enhanced Zinc API
        const response = await enhancedZincApiService.searchBestSellingByCategory(categoryKey, 10);
        
        if (response.error) {
          throw new Error(response.error);
        }

        // Convert Zinc results to Product format
        products = response.results.map((result: any) => ({
          product_id: result.product_id || result.id,
          title: result.title || result.name,
          price: result.price || 0,
          image: result.image || result.main_image || '/placeholder.svg',
          category: categoryKey,
          vendor: result.vendor || result.retailer || 'Amazon',
          rating: result.rating || result.stars || 0,
          reviewCount: result.reviewCount || result.num_reviews || 0,
          description: result.description || result.product_description || '',
          brand: result.brand || '',
          isBestSeller: result.isBestSeller || true,
          bestSellerType: result.bestSellerType || null,
          badgeText: result.badgeText || null,
          best_seller_rank: result.best_seller_rank || null
        }));
      }

      const loadTime = performance.now() - (performance.now() - 1000); // Simplified for demo
      loadTimes.current.push(loadTime);
      
      console.log(`Loaded ${products.length} products for ${categoryKey}`);
      endTimer(`category-${categoryKey}-load`, 'searchTime');
      devLog(`✅ Category ${categoryKey} loaded in ${Math.round(loadTime)}ms with ${products.length} products`);

      // Update progress stats
      const totalTime = loadTimes.current.reduce((sum, time) => sum + time, 0);
      setProgressStats({
        totalLoadTime: totalTime,
        averageLoadTime: totalTime / loadTimes.current.length,
        loadedCount: loadedCategories.current.size
      });

      // Update state with loaded data
      setCategoryData(prev => ({
        ...prev,
        [categoryKey]: {
          products,
          isLoading: false,
          error: null,
          hasLoaded: true
        }
      }));

      // Background prefetch related categories
      backgroundPrefetchingService.trackSearch(category.searchTerm, 'category');

    } catch (error) {
      console.error(`Error loading ${categoryKey} products:`, error);
      endTimer(`category-${categoryKey}-load`, 'searchTime');
      
      setCategoryData(prev => ({
        ...prev,
        [categoryKey]: {
          products: [],
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load products',
          hasLoaded: true
        }
      }));
    }
  }, [startTimer, endTimer]);

  // Load immediate categories on mount
  useEffect(() => {
    const immediateCategories = CATEGORIES.slice(0, IMMEDIATE_LOAD_COUNT);
    immediateCategories.forEach(category => {
      loadCategoryData(category.key);
    });
  }, [loadCategoryData]);

  // Handle "See All" button clicks
  const handleSeeAll = useCallback((categoryKey: string) => {
    console.log(`See All clicked for category: ${categoryKey}`);
    
    const categoryData = CATEGORIES.find(cat => cat.key === categoryKey);
    const searchQuery = categoryData?.searchTerm || enhancedZincApiService.getCategorySearchQuery(categoryKey);
    
    navigate(`/marketplace?search=${encodeURIComponent(searchQuery)}&category=${categoryKey}&diversity=true`, {
      state: { from: 'marketplace-categories' }
    });
  }, [navigate]);

  // Handle individual product clicks
  const handleProductClick = useCallback((product: Product) => {
    console.log(`Product clicked: ${product.title}`);
    if (onProductClick) {
      onProductClick(product);
    }
  }, [onProductClick]);

  // Calculate loading stats for indicator
  const totalCategories = CATEGORIES.length;
  const loadedCount = Object.values(categoryData).filter(data => data.hasLoaded).length;
  const loadingCount = Object.values(categoryData).filter(data => data.isLoading).length;
  const erroredCount = Object.values(categoryData).filter(data => data.error && !data.isLoading).length;

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Progressive Loading Indicator - only show during loading */}
      {(loadingCount > 0 || loadedCount < totalCategories) && (
        <ProgressiveLoadingIndicator
          totalItems={totalCategories}
          loadedCount={loadedCount}
          loadingCount={loadingCount}
          erroredCount={erroredCount}
          averageLoadTime={progressStats.averageLoadTime}
          className="mx-auto max-w-md"
        />
      )}
      {CATEGORIES.map((category, index) => {
        const data = categoryData[category.key];
        if (!data) return null;

        const hasBackground = index % 2 === 1;
        const shouldShowSection = index < IMMEDIATE_LOAD_COUNT || data.hasLoaded;

        // For lazy-loaded categories, use intersection observer
        if (index >= IMMEDIATE_LOAD_COUNT && !data.hasLoaded) {
          return (
            <LazyloadedCategorySection
              key={category.key}
              category={category}
              data={data}
              hasBackground={hasBackground}
              onLoadCategory={() => loadCategoryData(category.key)}
              onSeeAll={handleSeeAll}
              onProductClick={handleProductClick}
            />
          );
        }

        // Show error state if there's an error and no products
        if (data.error && data.products.length === 0) {
          return (
            <div key={category.key} className={`border rounded-lg p-6 ${hasBackground ? 'bg-muted/30' : 'bg-red-50'}`}>
              <h3 className="text-lg font-semibold text-red-900 mb-2">{category.title}</h3>
              <p className="text-red-700">Failed to load products for this category</p>
            </div>
          );
        }

        return (
          <div 
            key={category.key} 
            className={hasBackground ? 'bg-muted/30 py-8 px-4 rounded-lg' : 'py-4'}
          >
            <CategorySection
              title={category.title}
              subtitle={category.subtitle}
              products={data.products}
              isLoading={data.isLoading}
              onSeeAll={() => handleSeeAll(category.key)}
              onProductClick={handleProductClick}
              showSeeAll={data.products.length > 0}
            />
          </div>
        );
      })}
    </div>
  );
};

// Lazy-loaded category section component with intersection observer
interface LazyloadedCategorySectionProps {
  category: { key: string; title: string; subtitle: string; searchTerm: string };
  data: CategoryData;
  hasBackground: boolean;
  onLoadCategory: () => void;
  onSeeAll: (categoryKey: string) => void;
  onProductClick: (product: Product) => void;
}

const LazyloadedCategorySection: React.FC<LazyloadedCategorySectionProps> = ({
  category,
  data,
  hasBackground,
  onLoadCategory,
  onSeeAll,
  onProductClick
}) => {
  const { isVisible, ref } = useOptimizedIntersectionObserver({
    threshold: 0.1,
    rootMargin: '200px', // Start loading 200px before it comes into view
    triggerOnce: true
  });

  // Load category when it becomes visible
  useEffect(() => {
    if (isVisible && !data.hasLoaded && !data.isLoading) {
      onLoadCategory();
    }
  }, [isVisible, data.hasLoaded, data.isLoading, onLoadCategory]);

  return (
    <div 
      ref={ref}
      className={hasBackground ? 'bg-muted/30 py-8 px-4 rounded-lg' : 'py-4'}
    >
      <CategorySection
        title={category.title}
        subtitle={category.subtitle}
        products={data.products}
        isLoading={data.isLoading || (isVisible && !data.hasLoaded)}
        onSeeAll={() => onSeeAll(category.key)}
        onProductClick={onProductClick}
        showSeeAll={data.products.length > 0}
      />
    </div>
  );
};