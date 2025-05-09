import { useState, useEffect, useCallback } from "react";
import { RecentlyViewedProduct, Profile } from "@/types/supabase";
import { Product } from "@/types/product";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * A hook to synchronize product data between local storage and the user profile in the database.
 * This provides a central mechanism for reliably tracking product interactions.
 */
export function useProductDataSync() {
  const { user } = useAuth();
  const { profile, refetchProfile } = useProfile();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [syncQueue, setSyncQueue] = useState<RecentlyViewedProduct[]>([]);
  const [syncError, setSyncError] = useState<Error | null>(null);

  // Clear any errors when dependencies change
  useEffect(() => {
    setSyncError(null);
  }, [user, profile]);

  // Process the sync queue when items are added
  useEffect(() => {
    if (syncQueue.length > 0 && user && profile && !isSyncing) {
      processSyncQueue();
    }
  }, [syncQueue, user, profile, isSyncing]);

  // Main function to track a viewed product
  const trackProductView = useCallback((product: Product) => {
    if (!product) return;
    
    // Extract consistent product ID
    const productId = product.product_id || product.id || "";
    if (!productId) {
      console.warn("Cannot track product without ID:", product);
      return;
    }
    
    console.log("Tracking product view:", productId, product.title || product.name);
    
    // Create standardized product data
    const productData: RecentlyViewedProduct = {
      id: productId,
      name: product.title || product.name || "",
      image: product.image || "",
      price: product.price,
      viewed_at: new Date().toISOString()
    };
    
    // Add to sync queue
    setSyncQueue(prev => {
      // Remove existing entry of the same product if present
      const filtered = prev.filter(item => item.id !== productId);
      // Add new entry at the beginning and maintain max length
      return [productData, ...filtered];
    });
    
    return productData;
  }, []);

  // Process the sync queue
  const processSyncQueue = useCallback(async () => {
    if (!user || !profile || isSyncing || syncQueue.length === 0) return;
    
    try {
      setIsSyncing(true);
      console.log("Processing sync queue with", syncQueue.length, "items");
      
      // Get existing recently viewed array from profile or create a new one
      const recentlyViewed = Array.isArray(profile.recently_viewed) 
        ? profile.recently_viewed 
        : [];
      
      // Merge queue with existing data, removing duplicates and keeping most recent
      const productMap = new Map<string, RecentlyViewedProduct>();
      
      // First add existing items to the map
      recentlyViewed.forEach(product => {
        productMap.set(product.id, product);
      });
      
      // Then add queue items (these will overwrite existing entries with the same id)
      syncQueue.forEach(product => {
        productMap.set(product.id, product);
      });
      
      // Convert map back to array and sort by viewed_at descending
      const mergedProducts = Array.from(productMap.values())
        .sort((a, b) => {
          const dateA = new Date(a.viewed_at || 0);
          const dateB = new Date(b.viewed_at || 0);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 20); // Limit to 20 items
      
      // Update profile with new recently viewed list
      const { error } = await supabase
        .from('profiles')
        .update({
          recently_viewed: mergedProducts,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
        
      if (error) {
        console.error("Error updating recently viewed products in profile:", error);
        setSyncError(new Error(error.message));
      } else {
        console.log("Successfully synced", syncQueue.length, "products to profile");
        // Clear the queue since we've processed it
        setSyncQueue([]);
        setLastSyncTime(Date.now());
        
        // Refresh profile to ensure updated data is available throughout the app
        setTimeout(() => {
          refetchProfile().catch(err => 
            console.error("Error refreshing profile after updating recently viewed:", err)
          );
        }, 100);
      }
    } catch (err) {
      console.error("Error syncing product data with profile:", err);
      setSyncError(err instanceof Error ? err : new Error('Unknown error during sync'));
      // Keep items in queue to retry later
    } finally {
      setIsSyncing(false);
    }
  }, [user, profile, isSyncing, syncQueue, refetchProfile]);

  // Force a sync (useful for components that want to ensure data is synced before unmounting)
  const forceSyncNow = useCallback(async () => {
    await processSyncQueue();
  }, [processSyncQueue]);

  // Retry sync if there was an error
  const retrySyncAfterError = useCallback(() => {
    if (syncError) {
      setSyncError(null);
      processSyncQueue();
    }
  }, [syncError, processSyncQueue]);

  return {
    trackProductView,
    forceSyncNow,
    isSyncing,
    lastSyncTime,
    syncError,
    retrySyncAfterError,
    queueLength: syncQueue.length
  };
}
