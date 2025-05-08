
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { Product } from "@/types/product";
import { useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { RecentlyViewedProduct } from "@/types/supabase";
import { toast } from "sonner";

export const useProductTracking = (products: Product[]) => {
  const { addToRecentlyViewed } = useRecentlyViewed();
  const [searchParams] = useSearchParams();
  const { profile, refreshProfile } = useProfile();
  const { user } = useAuth();
  
  // Track product view when opened via URL parameter
  useEffect(() => {
    const productId = searchParams.get("productId");
    if (productId) {
      trackProductView(productId);
    }
  }, [searchParams]);
  
  const trackProductView = (productId: string) => {
    console.log("Tracking product view:", productId);
    
    // Find the product in the current products list
    const product = products.find(p => (p.product_id || p.id) === productId);
    if (product) {
      console.log("Found product to track:", product.title || product.name);
      
      // Add to recently viewed in local storage
      addToRecentlyViewed({
        id: product.product_id || product.id || "",
        name: product.title || product.name || "",
        image: product.image || "",
        price: product.price
      });
      
      // If user is logged in, sync with profile
      if (user && profile) {
        syncWithProfile(product);
      } else {
        console.log("User not logged in or profile not loaded, skipping profile sync");
      }
    } else {
      console.warn(`Product with ID ${productId} not found in current products list`);
    }
  };
  
  // Sync viewed products with user's profile for better visibility across the app
  const syncWithProfile = async (product: Product) => {
    if (!user || !profile) return;
    
    try {
      console.log("Syncing viewed product with profile:", product.product_id || product.id);
      
      // Get existing recently_viewed array from profile or create a new one
      const recentlyViewed = Array.isArray(profile.recently_viewed) 
        ? profile.recently_viewed 
        : [];
        
      // Add current product to the front of the array (most recent first)
      const productData: RecentlyViewedProduct = {
        id: product.product_id || product.id || "",
        name: product.title || product.name || "",
        image: product.image || "",
        price: product.price,
        viewed_at: new Date().toISOString()
      };
      
      // Remove existing entry of the same product if present
      const filteredRecentlyViewed = recentlyViewed.filter(
        item => item.id !== productData.id
      );
      
      // Add new entry at the beginning and limit to 20 items
      const updatedRecentlyViewed = [
        productData,
        ...filteredRecentlyViewed
      ].slice(0, 20);
      
      // Update profile with new recently viewed list
      const { error } = await supabase
        .from('profiles')
        .update({
          recently_viewed: updatedRecentlyViewed,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
        
      if (error) {
        console.error("Error updating recently viewed products in profile:", error);
      } else {
        console.log("Successfully updated recently viewed products in profile");
        // Refresh profile to ensure updated data is available throughout the app
        refreshProfile();
      }
    } catch (err) {
      console.error("Error syncing product view with profile:", err);
    }
  };

  return { trackProductView };
};
