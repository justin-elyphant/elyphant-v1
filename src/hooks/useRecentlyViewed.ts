
import { useState, useEffect } from 'react';
import { RecentlyViewedItem } from '@/types/profile';

type RecentlyViewedProduct = {
  id: string;
  title: string; // Changed from "name" to "title" for consistency
  image?: string;
  price?: number;
  brand?: string;
};

export const useRecentlyViewed = () => {
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedItems = localStorage.getItem('recentlyViewed');
      if (savedItems) {
        setRecentlyViewed(JSON.parse(savedItems));
      }
    } catch (error) {
      console.error('Error loading recently viewed items:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addItem = (item: RecentlyViewedProduct) => {
    setRecentlyViewed(prev => {
      const exists = prev.some(i => i.product_id === item.id);
      
      if (exists) {
        return prev.map(i => 
          i.product_id === item.id 
            ? {
                ...i,
                viewed_at: new Date().toISOString(),
                product_data: {
                  ...i.product_data,
                  title: item.title,
                  price: item.price,
                  image_url: item.image,
                  brand: item.brand
                }
              }
            : i
        );
      }
      
      const newItem: RecentlyViewedItem = {
        id: crypto.randomUUID(),
        product_id: item.id,
        viewed_at: new Date().toISOString(),
        product_data: {
          title: item.title,
          price: item.price,
          image_url: item.image,
          brand: item.brand
        }
      };
      
      const newItems = [newItem, ...prev].slice(0, 20);
      localStorage.setItem('recentlyViewed', JSON.stringify(newItems));
      return newItems;
    });
  };

  const removeItem = (productId: string) => {
    setRecentlyViewed(prev => {
      const newItems = prev.filter(item => item.product_id !== productId);
      localStorage.setItem('recentlyViewed', JSON.stringify(newItems));
      return newItems;
    });
  };

  const clearAll = () => {
    localStorage.removeItem('recentlyViewed');
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
