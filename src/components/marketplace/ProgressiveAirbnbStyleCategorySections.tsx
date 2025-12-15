import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Product } from "@/types/product";
import { CategorySection } from "./CategorySection";
import { productCatalogService } from "@/services/ProductCatalogService";
import { getFeaturedCategories } from "@/constants/categories";
import { useOptimizedIntersectionObserver } from "@/hooks/useOptimizedIntersectionObserver";
import { usePerformanceMonitoring } from "@/hooks/usePerformanceMonitoring";
import { devLog } from "@/utils/performanceOptimizations";

// Category search query mappings
const CATEGORY_SEARCH_QUERIES: Record<string, string> = {
  electronics: "best selling electronics phones computers laptops headphones cameras",
  tech: "best selling tech electronics Apple gaming headphones speakers smart watch",
  beauty: "best selling skincare makeup cosmetics beauty products personal care",
  homeKitchen: "kitchen home cooking utensils cookware appliances storage",
  arts: "arts crafts supplies scrapbooking painting drawing crafting tools",
  athleisure: "athletic wear yoga pants leggings activewear fitness clothing",
  books: "best selling books novels fiction non-fiction educational textbooks",
  fashion: "clothing apparel shoes accessories fashion style trending outfits",
  flowers: "fresh flowers bouquet delivery roses tulips arrangements floral gifts",
  food: "gourmet food specialty snacks organic coffee tea chocolate wine cheese",
  home: "home decor furniture accessories organization storage household items",
  pets: "pet supplies dog cat accessories toys treats food pet care",
  sports: "sports equipment fitness gear outdoor recreation exercise equipment",
  toys: "toys games kids children educational fun entertainment play",
  "best-selling": "best selling top rated popular trending most bought bestseller",
  wedding: "wedding gifts bridal party engagement ceremony reception decorations",
  baby: "baby gifts newborn infant toddler nursery toys clothes feeding"
};

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

const FEATURED_CATEGORIES = getFeaturedCategories();

const CATEGORIES = FEATURED_CATEGORIES.map(category => ({
  key: category.value,
  title: `Best Selling ${category.displayName || category.name}`,
  subtitle: category.description,
  searchTerm: category.searchTerm
}));

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

  const loadCategoryData = useCallback(async (categoryKey: string) => {
    if (loadedCategories.current.has(categoryKey)) return;
    
    loadedCategories.current.add(categoryKey);
    const category = CATEGORIES.find(cat => cat.key === categoryKey);
    if (!category) return;

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
      
      const response = await productCatalogService.searchProducts(category.searchTerm, {
        category: categoryKey,
        limit: 5
      });

      let products: Product[] = [];

      if (response.products && response.products.length > 0) {
        products = response.products.map((result: any) => ({
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
          isBestSeller: result.isBestSeller ?? false,
          bestSellerType: result.bestSellerType || null,
          badgeText: result.badgeText || null,
          best_seller_rank: result.best_seller_rank || null
        }));
        console.log(`Using results for ${categoryKey}: ${products.length} products`);
      }

      const loadTime = performance.now();
      loadTimes.current.push(loadTime);
      
      console.log(`Loaded ${products.length} products for ${categoryKey}`);
      endTimer(`category-${categoryKey}-load`, 'searchTime');
      devLog(`✅ Category ${categoryKey} loaded with ${products.length} products`);

      setCategoryData(prev => ({
        ...prev,
        [categoryKey]: {
          products,
          isLoading: false,
          error: null,
          hasLoaded: true
        }
      }));

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

  useEffect(() => {
    const immediateCategories = CATEGORIES.slice(0, IMMEDIATE_LOAD_COUNT);
    immediateCategories.forEach(category => {
      loadCategoryData(category.key);
    });
  }, [loadCategoryData]);

  const handleSeeAll = useCallback((categoryKey: string) => {
    console.log(`See All clicked for category: ${categoryKey}`);
    
    const categoryDataItem = CATEGORIES.find(cat => cat.key === categoryKey);
    const searchQuery = categoryDataItem?.searchTerm || CATEGORY_SEARCH_QUERIES[categoryKey] || categoryKey;
    
    navigate(`/marketplace?search=${encodeURIComponent(searchQuery)}&category=${categoryKey}&diversity=true`, {
      state: { from: 'marketplace-categories' }
    });
  }, [navigate]);

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
          return null;
        }

        const hasBackground = index % 2 === 1;

        if (index >= IMMEDIATE_LOAD_COUNT) {
          return (
            <LazyloadedCategorySection
              key={category.key}
              category={category}
              data={data}
              hasBackground={hasBackground}
              onLoadCategory={() => {
                loadCategoryData(category.key);
              }}
              onSeeAll={handleSeeAll}
              onProductClick={handleProductClick}
              onAddToCart={onAddToCart}
            />
          );
        }

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
    threshold: 0.01,
    rootMargin: '800px',
    triggerOnce: true
  });

  const shouldForceLoad = React.useRef(false);
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (!data.hasLoaded && !data.isLoading) {
        shouldForceLoad.current = true;
        onLoadCategory();
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [data.hasLoaded, data.isLoading, onLoadCategory]);

  useEffect(() => {
    if ((isVisible || shouldForceLoad.current) && !data.hasLoaded && !data.isLoading) {
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
        isLoading={data.isLoading}
        onSeeAll={() => onSeeAll(category.key)}
        onProductClick={onProductClick}
        onAddToCart={onAddToCart}
        showSeeAll={data.products.length > 0}
      />
    </div>
  );
};
