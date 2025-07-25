
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Product } from "@/types/product";
import { CategorySection } from "./CategorySection";
import { enhancedZincApiService } from "@/services/enhancedZincApiService";
import { getFeaturedCategories } from "@/constants/categories";
import { toast } from "sonner";

interface AirbnbStyleCategorySectionsProps {
  className?: string;
  onProductClick?: (product: Product) => void;
}

interface CategoryData {
  products: Product[];
  isLoading: boolean;
  error: string | null;
}

// Get featured categories from the constants (same as homepage)
const FEATURED_CATEGORIES = getFeaturedCategories();

const CATEGORIES = FEATURED_CATEGORIES.map(category => ({
  key: category.value,
  title: `Best Selling ${category.displayName || category.name}`,
  subtitle: category.description,
  searchTerm: category.searchTerm
}));

export const AirbnbStyleCategorySections: React.FC<AirbnbStyleCategorySectionsProps> = ({ className, onProductClick }) => {
  const navigate = useNavigate();
  const [categoryData, setCategoryData] = useState<Record<string, CategoryData>>({});

  // Load category data on mount
  useEffect(() => {
    const loadCategoryData = async () => {
      console.log('Loading category data from Zinc API...');
      
      // Initialize loading state for all categories
      const initialData: Record<string, CategoryData> = {};
      CATEGORIES.forEach(category => {
        initialData[category.key] = {
          products: [],
          isLoading: true,
          error: null
        };
      });
      setCategoryData(initialData);

      // Load each category independently
      const categoryPromises = CATEGORIES.map(async (category) => {
        try {
          console.log(`Loading products for category: ${category.key}`);
          const response = await enhancedZincApiService.searchBestSellingByCategory(category.key, 10);
          
          if (response.error) {
            console.error(`Error loading ${category.key} products:`, response.error);
            return {
              key: category.key,
              data: {
                products: [],
                isLoading: false,
                error: response.error
              }
            };
          }

          // Convert Zinc results to Product format
          const products: Product[] = response.results.map((result: any) => ({
            product_id: result.product_id || result.id,
            title: result.title || result.name,
            price: result.price || 0,
            image: result.image || result.main_image || '/placeholder.svg',
            category: category.key,
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

          console.log(`Loaded ${products.length} products for ${category.key}`);

          return {
            key: category.key,
            data: {
              products,
              isLoading: false,
              error: null
            }
          };
        } catch (error) {
          console.error(`Error loading ${category.key} products:`, error);
          return {
            key: category.key,
            data: {
              products: [],
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to load products'
            }
          };
        }
      });

      // Update category data as each category loads
      const results = await Promise.allSettled(categoryPromises);
      const updatedData: Record<string, CategoryData> = {};
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          updatedData[result.value.key] = result.value.data;
        } else {
          const categoryKey = CATEGORIES[index].key;
          updatedData[categoryKey] = {
            products: [],
            isLoading: false,
            error: 'Failed to load category data'
          };
        }
      });

      setCategoryData(updatedData);
    };

    loadCategoryData();
  }, []);

  // Handle "See All" button clicks
  const handleSeeAll = (categoryKey: string) => {
    console.log(`See All clicked for category: ${categoryKey}`);
    
    // Find the category data to get the search term
    const categoryData = CATEGORIES.find(cat => cat.key === categoryKey);
    const searchQuery = categoryData?.searchTerm || enhancedZincApiService.getCategorySearchQuery(categoryKey);
    
    // Navigate to marketplace with category search (same as homepage behavior)
    navigate(`/marketplace?search=${encodeURIComponent(searchQuery)}&category=${categoryKey}&diversity=true`, {
      state: { from: 'marketplace-categories' }
    });
  };

  // Handle individual product clicks
  const handleProductClick = (product: Product) => {
    console.log(`Product clicked: ${product.title}`);
    // Open product details in the StreamlinedMarketplaceWrapper's dialog instead of navigating
    if (onProductClick) {
      onProductClick(product);
    }
  };

  if (Object.keys(categoryData).length === 0) {
    return (
      <div className={`space-y-8 ${className}`}>
        {CATEGORIES.map(category => (
          <div key={category.key} className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="flex gap-4 overflow-hidden">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-48 h-64 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {CATEGORIES.map(category => {
        const data = categoryData[category.key];
        
        if (!data) return null;

        // Show error state if there's an error and no products
        if (data.error && data.products.length === 0) {
          return (
            <div key={category.key} className="border rounded-lg p-6 bg-red-50">
              <h3 className="text-lg font-semibold text-red-900 mb-2">{category.title}</h3>
              <p className="text-red-700">Failed to load products for this category</p>
            </div>
          );
        }

        return (
          <CategorySection
            key={category.key}
            title={category.title}
            subtitle={category.subtitle}
            products={data.products}
            isLoading={data.isLoading}
            onSeeAll={() => handleSeeAll(category.key)}
            onProductClick={handleProductClick}
            showSeeAll={data.products.length > 0}
          />
        );
      })}
    </div>
  );
};
