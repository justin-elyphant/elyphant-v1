
import { useState, useEffect } from 'react';
import { useLocalStorage } from '@/components/gifting/hooks/useLocalStorage';
import { RecentlyViewedItem } from '@/types/profile';

interface UseRecentlyViewedOptions {
  limit?: number;
}

export const useRecentlyViewed = (options: UseRecentlyViewedOptions = {}) => {
  const { limit = 10 } = options;
  const [recentlyViewed, setRecentlyViewed] = useLocalStorage<RecentlyViewedItem[]>('recently_viewed', []);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize or load data if needed
    setLoading(false);
  }, []);

  const addItem = (item: {
    id: string;
    title: string;
    image?: string;
    price?: number;
    brand?: string;
  }) => {
    setRecentlyViewed(prev => {
      // Check if item already exists
      const existingIndex = prev.findIndex(i => i.product_id === item.id);
      
      // Create new item
      const newItem: RecentlyViewedItem = {
        id: crypto.randomUUID(),
        product_id: item.id,
        viewed_at: new Date().toISOString(),
        product_data: {
          title: item.title,
          image_url: item.image,
          price: item.price,
          brand: item.brand
        }
      };
      
      // If item exists, remove it (we'll add it to the front)
      const filtered = existingIndex >= 0 
        ? prev.filter((_, i) => i !== existingIndex)
        : prev;
      
      // Add new item to the front and limit the list
      return [newItem, ...filtered].slice(0, limit);
    });
  };

  const removeItem = (productId: string) => {
    setRecentlyViewed(prev => prev.filter(item => item.product_id !== productId));
  };

  const clearAll = () => {
    setRecentlyViewed([]);
  };

  return {
    recentlyViewed,
    loading,
    addItem,
    removeItem,
    clearAll
  };
};

export default useRecentlyViewed;
