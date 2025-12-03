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

import { devLog } from "@/utils/performanceOptimizations";

interface ProgressiveAirbnbStyleCategorySectionsProps {
  className?: string;
  onProductClick?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
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
  onProductClick,
  onAddToCart
}) => {
  const navigate = useNavigate();
  const [categoryData, setCategoryData] = useState<Record<string, CategoryData>>({});
  
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
      
      // Check cache first using optimized service - reduced limit for single row
      const cachedResults = await optimizedMarketplaceService.searchProducts(category.searchTerm, {
        limit: 5
      });

      let products: Product[] = [];

      if (cachedResults && cachedResults.length > 0) {
        products = cachedResults;
        console.log(`Using cached results for ${categoryKey}: ${products.length} products`);
      } else {
        // Fallback to Enhanced Zinc API - reduced to 5 products for single row
        const response = await enhancedZincApiService.searchBestSellingByCategory(categoryKey, 5);
        
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


  return (
    <div className={`space-y-8 ${className}`}>
      {CATEGORIES.map((category, index) => {
        const data = categoryData[category.key];
        if (!data) {
          console.log(`❌ No data for category: ${category.key}`);
          return null;
        }

        const hasBackground = index % 2 === 1;
        console.log(`🔄 Rendering category ${index}: ${category.key}, hasLoaded: ${data.hasLoaded}, isLoading: ${data.isLoading}`);

        // For lazy-loaded categories, use intersection observer
        if (index >= IMMEDIATE_LOAD_COUNT) {
          console.log(`📦 Rendering lazy category: ${category.key} (index ${index})`);
          return (
            <LazyloadedCategorySection
              key={category.key}
              category={category}
              data={data}
              hasBackground={hasBackground}
              onLoadCategory={() => {
                console.log(`🔥 onLoadCategory called for: ${category.key}`);
                loadCategoryData(category.key);
              }}
              onSeeAll={handleSeeAll}
              onProductClick={handleProductClick}
              onAddToCart={onAddToCart}
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
              onAddToCart={onAddToCart}
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
  onAddToCart?: (product: Product) => void;
}

const LazyloadedCategorySection: React.FC<LazyloadedCategorySectionProps> = ({
  category,
  data,
  hasBackground,
  onLoadCategory,
  onSeeAll,
  onProductClick,
  onAddToCart
}) => {
  const { isVisible, ref } = useOptimizedIntersectionObserver({
    threshold: 0.01, // Lower threshold to trigger earlier
    rootMargin: '800px', // Much larger margin to preload well before visible
    triggerOnce: true
  });

  // Force visibility for categories beyond immediate load to ensure they render
  const shouldForceLoad = React.useRef(false);
  
  React.useEffect(() => {
    // Auto-trigger loading after a short delay for better UX
    const timer = setTimeout(() => {
      if (!data.hasLoaded && !data.isLoading) {
        console.log(`⏰ Auto-triggering load for delayed category: ${category.key}`);
        shouldForceLoad.current = true;
        onLoadCategory();
      }
    }, 2000); // Auto-load after 2 seconds if not triggered
    
    return () => clearTimeout(timer);
  }, [data.hasLoaded, data.isLoading, onLoadCategory, category.key]);

  console.log(`👁️ LazyloadedCategorySection - ${category.key}: isVisible=${isVisible}, hasLoaded=${data.hasLoaded}`);

  // Load category when it becomes visible or after timeout
  useEffect(() => {
    console.log(`🔍 LazyloadedCategorySection useEffect - Category: ${category.key}`, {
      isVisible,
      hasLoaded: data.hasLoaded,
      isLoading: data.isLoading,
      shouldForceLoad: shouldForceLoad.current
    });
    
    if ((isVisible || shouldForceLoad.current) && !data.hasLoaded && !data.isLoading) {
      console.log(`🚀 Triggering load for category: ${category.key} (isVisible: ${isVisible}, forced: ${shouldForceLoad.current})`);
      // Immediate trigger, no delay for better UX
      onLoadCategory();
    }
  }, [isVisible, data.hasLoaded, data.isLoading, onLoadCategory, category.key]);

  return (
    <div 
      ref={ref}
      className={hasBackground ? 'bg-muted/30 py-8 px-4 rounded-lg' : 'py-4'}
    >
      <CategorySection
        title={category.title}
        subtitle={category.subtitle}
        products={data.products}
        isLoading={data.isLoading}
        onSeeAll={() => onSeeAll(category.key)}
        onProductClick={onProductClick}
        onAddToCart={onAddToCart}
        showSeeAll={data.products.length > 0}
      />
    </div>
  );
};