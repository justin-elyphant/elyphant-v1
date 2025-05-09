
import { useState, useEffect, useCallback } from "react";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";
import { useProductDataSync } from "./useProductDataSync";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { Product } from "@/types/product";

export interface RecentlyViewedItem {
  id: string;
  name: string;
  image?: string;
  price?: number;
  viewedAt: number; // timestamp
}

const MAX_RECENTLY_VIEWED = 20;

export function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useLocalStorage<RecentlyViewedItem[]>(
    "recentlyViewed",
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const { trackProductView } = useProductDataSync();
  const { user } = useAuth();
  const { profile } = useProfile();

  // Sync with profile data on component mount if user is logged in
  useEffect(() => {
    const syncWithProfile = () => {
      if (!profile || !profile.recently_viewed || !Array.isArray(profile.recently_viewed)) {
        return;
      }
      
      // Create local storage items from profile data
      const profileItems = profile.recently_viewed.map(item => ({
        id: item.id,
        name: item.name,
        image: item.image,
        price: item.price,
        viewedAt: item.viewed_at ? new Date(item.viewed_at).getTime() : Date.now()
      }));
      
      // Merge with existing local data, preferring profile data for duplicates
      const existingIds = new Set(profileItems.map(item => item.id));
      const localOnly = recentlyViewed.filter(item => !existingIds.has(item.id));
      
      // Combine and sort by viewedAt
      const combined = [...profileItems, ...localOnly]
        .sort((a, b) => b.viewedAt - a.viewedAt)
        .slice(0, MAX_RECENTLY_VIEWED);
      
      setRecentlyViewed(combined);
    };
    
    if (user && profile) {
      syncWithProfile();
    }
    setIsLoading(false);
  }, [profile, user, setRecentlyViewed]);

  const addToRecentlyViewed = useCallback((item: Omit<RecentlyViewedItem, "viewedAt">) => {
    // Update local storage immediately for responsive UI
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
    
    // If a full product object is available, sync with profile
    if (user) {
      // Create a minimal Product object for tracking
      const product: Product = {
        product_id: item.id,
        id: item.id,
        title: item.name,
        name: item.name,
        price: item.price || 0,
        image: item.image || ""
      };
      
      // Track the product view for profile syncing
      trackProductView(product);
    }
  }, [setRecentlyViewed, trackProductView, user]);

  const clearRecentlyViewed = useCallback(() => {
    setRecentlyViewed([]);
  }, [setRecentlyViewed]);

  return {
    recentlyViewed,
    addToRecentlyViewed,
    clearRecentlyViewed,
    isLoading,
  };
}
