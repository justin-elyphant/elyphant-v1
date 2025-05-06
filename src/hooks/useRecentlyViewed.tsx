
import { useState, useEffect } from "react";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";

export interface RecentlyViewedItem {
  id: string;
  name: string;
  image?: string;
  price?: number;
  viewedAt: number; // timestamp
}

const MAX_RECENTLY_VIEWED = 10;

export function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useLocalStorage<RecentlyViewedItem[]>(
    "recentlyViewed",
    []
  );
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from storage on component mount
  useEffect(() => {
    setIsLoading(false);
  }, []);

  const addToRecentlyViewed = (item: Omit<RecentlyViewedItem, "viewedAt">) => {
    setRecentlyViewed((current) => {
      // Remove if item already exists
      const filtered = current.filter((i) => i.id !== item.id);
      
      // Add to beginning of array with current timestamp
      const newItem: RecentlyViewedItem = {
        ...item,
        viewedAt: Date.now(),
      };
      
      // Return new array with max length
      return [newItem, ...filtered].slice(0, MAX_RECENTLY_VIEWED);
    });
  };

  const clearRecentlyViewed = () => {
    setRecentlyViewed([]);
  };

  return {
    recentlyViewed,
    addToRecentlyViewed,
    clearRecentlyViewed,
    isLoading,
  };
}
