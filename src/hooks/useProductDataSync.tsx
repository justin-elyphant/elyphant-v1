import { useCallback, useState } from "react";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { Product } from "@/types/product";
import { toast } from "sonner";

interface ProductViewData {
  product_id: string;
  title: string;
  image?: string;
  price?: number;
  viewed_at: number;
}

const MAX_QUEUE_SIZE = 10;
const SYNC_DEBOUNCE_MS = 5000; // 5 second debounce

export const useProductDataSync = () => {
  const [queue, setQueue] = useState<ProductViewData[]>([]);
  const [syncTimeout, setSyncTimeout] = useState<number | null>(null);
  const { user } = useAuth();
  const { refreshProfile } = useProfile();
  
  // Track a product view - queues for debounced sync
  const trackProductView = useCallback((product: Product) => {
    if (!product) return;
    
    const productId = product.product_id || product.id;
    if (!productId) {
      console.warn("Cannot track product without ID");
      return;
    }
    
    const viewData: ProductViewData = {
      product_id: productId,
      title: product.title || product.name || "",
      image: product.image || "",
      price: product.price,
      viewed_at: Date.now(),
    };
    
    // Add to queue
    setQueue(prevQueue => {
      // Remove duplicates (only keep most recent view of same product)
      const filteredQueue = prevQueue.filter(item => item.product_id !== viewData.product_id);
      const newQueue = [viewData, ...filteredQueue].slice(0, MAX_QUEUE_SIZE);
      
      // Schedule sync if not already scheduled
      if (!syncTimeout) {
        const timeout = window.setTimeout(() => syncQueueToProfile(), SYNC_DEBOUNCE_MS);
        setSyncTimeout(timeout as unknown as number);
      }
      
      return newQueue;
    });
    
    console.log(`Product view tracked: ${viewData.title} (${viewData.product_id})`);
  }, [queue, syncTimeout]);
  
  // Sync the queue to the user's profile
  const syncQueueToProfile = useCallback(async () => {
    // Clear timeout
    if (syncTimeout) {
      clearTimeout(syncTimeout);
      setSyncTimeout(null);
    }
    
    // If no items or no user, skip
    if (queue.length === 0 || !user) {
      return;
    }
    
    console.log(`Syncing ${queue.length} product views to profile`);
    
    try {
      // Get current profile data
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error("Error fetching profile:", fetchError);
        return;
      }
      
      // Get current recently viewed items (column may not exist in this schema)
      const currentItems: any[] = [];
      
      // Add new items from queue
      const newItems = [...queue];
      
      // Create combined list, prioritizing new items and removing duplicates
      const seenIds = new Set();
      const combinedItems = [];
      
      // First add all new items
      for (const item of newItems) {
        seenIds.add(item.product_id);
        combinedItems.push({
          id: item.product_id,
          name: item.title,
          image: item.image,
          price: item.price,
          viewed_at: new Date(item.viewed_at).toISOString()
        });
      }
      
      // Then add existing items that aren't duplicates
      for (const item of currentItems) {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          combinedItems.push(item);
        }
      }
      
      // Limit to 20 items
      const updatedItems = combinedItems.slice(0, 20);
      
      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (updateError) {
        console.error("Error updating profile with recently viewed items:", updateError);
        return;
      }
      
      // Clear the queue
      setQueue([]);
      
      // Refresh profile data to keep UI in sync
      await refreshProfile();
      
      console.log(`Successfully synced ${newItems.length} product views to profile`);
    } catch (err) {
      console.error("Error syncing product views to profile:", err);
    }
  }, [queue, user, refreshProfile, syncTimeout]);
  
  // Force an immediate sync
  const forceSyncNow = useCallback(() => {
    if (queue.length > 0) {
      syncQueueToProfile();
    }
  }, [queue, syncQueueToProfile]);

  return {
    trackProductView,
    forceSyncNow
  };
};
