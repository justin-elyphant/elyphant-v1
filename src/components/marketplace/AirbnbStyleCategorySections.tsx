
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Product } from "@/types/product";
import { CategorySection } from "./CategorySection";
import { productCatalogService } from "@/services/ProductCatalogService";
import { getFeaturedCategories } from "@/constants/categories";

interface AirbnbStyleCategorySectionsProps {
  className?: string;
  onProductClick?: (product: Product) => void;
}

interface CategoryData {
  products: Product[];
  isLoading: boolean;
  error: string | null;
}

const FEATURED_CATEGORIES = getFeaturedCategories();

const CATEGORIES = FEATURED_CATEGORIES.map(category => ({
  key: category.value,
  title: `Best Selling ${category.displayName || category.name}`,
  subtitle: category.description,
  searchTerm: category.searchTerm
}));

export const AirbnbStyleCategorySections: React.FC<AirbnbStyleCategorySectionsProps> = ({ 
  className, 
  onProductClick
}) => {
  const navigate = useNavigate();
  const [categoryData, setCategoryData] = useState<Record<string, CategoryData>>({});

  useEffect(() => {
    const loadCategoryData = async () => {
      const initialData: Record<string, CategoryData> = {};
      CATEGORIES.forEach(category => {
        initialData[category.key] = { products: [], isLoading: true, error: null };
      });
      setCategoryData(initialData);

      const categoryPromises = CATEGORIES.map(async (category) => {
        try {
          const response = await productCatalogService.searchProducts(category.searchTerm, { 
            category: category.key, 
            limit: 10 
          });
          
          if (response.error) {
            return { key: category.key, data: { products: [], isLoading: false, error: response.error } };
          }

          const products: Product[] = (response.products || []).map((result: any) => ({
            product_id: result.product_id || result.id,
            title: result.title || result.name,
            price: result.price || 0,
            image: result.image || result.main_image || '/placeholder.svg',
            category: category.key,
            vendor: result.vendor || result.retailer || 'Amazon',
            rating: result.rating || result.stars || 0,
            reviewCount: result.reviewCount || result.num_reviews || 0,
            description: result.description || result.product_description || '',
            brand: result.brand || ''
          }));

          return { key: category.key, data: { products, isLoading: false, error: null } };
        } catch (error) {
          return { key: category.key, data: { products: [], isLoading: false, error: error instanceof Error ? error.message : 'Failed' } };
        }
      });

      const results = await Promise.allSettled(categoryPromises);
      const updatedData: Record<string, CategoryData> = {};
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          updatedData[result.value.key] = result.value.data;
        } else {
          updatedData[CATEGORIES[index].key] = { products: [], isLoading: false, error: 'Failed' };
        }
      });

      setCategoryData(updatedData);
    };

    loadCategoryData();
  }, []);

  const handleSeeAll = (categoryKey: string) => {
    const categoryDataItem = CATEGORIES.find(cat => cat.key === categoryKey);
    const searchQuery = categoryDataItem?.searchTerm || categoryKey;
    navigate(`/marketplace?search=${encodeURIComponent(searchQuery)}&category=${categoryKey}`, { state: { from: 'marketplace-categories' } });
  };

  const handleProductClick = (product: Product) => {
    if (onProductClick) onProductClick(product);
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {CATEGORIES.map((category, index) => {
        const data = categoryData[category.key];
        if (!data) return null;

        return (
          <div key={category.key} className={index % 2 === 1 ? 'bg-muted/30 py-8 px-4 rounded-lg' : 'py-4'}>
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
