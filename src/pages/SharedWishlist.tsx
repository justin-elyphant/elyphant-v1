
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Wishlist } from "@/types/profile";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import SharedWishlistSkeleton from "@/components/gifting/wishlist/SharedWishlistSkeleton";
import NoWishlistFound from "@/components/gifting/wishlist/NoWishlistFound";
import SharedWishlistView from "@/components/gifting/wishlist/SharedWishlistView";
import { enhanceWishlistItemWithSource } from "@/utils/productSourceDetection";

const SharedWishlist = () => {
  const { wishlistId } = useParams();
  const { user } = useAuth();
  const { profile } = useProfile();
  
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [ownerProfile, setOwnerProfile] = useState<any | null>(null);

  useEffect(() => {
    const fetchSharedWishlist = async () => {
      if (!wishlistId) return;

      try {
        setLoading(true);
        
        // Query the new wishlists table directly with proper joins
        const { data: wishlistData, error: wishlistError } = await supabase
          .from('wishlists')
          .select(`
            *,
            profiles!inner(id, name, profile_image)
          `)
          .eq('id', wishlistId)
          .single();
        
        if (wishlistError) {
          console.error("Error fetching wishlist:", wishlistError);
          // Don't show toast for guests - just show the NoWishlistFound UI
          return;
        }
        
        // Check access permissions
        const isOwner = user?.id === wishlistData.user_id;
        const canAccess = isOwner || wishlistData.is_public;
        
        if (!canAccess) {
          // Don't show toast for guests - just show the NoWishlistFound UI
          return;
        }
        
        // Fetch wishlist items
        const { data: items, error: itemsError } = await supabase
          .from('wishlist_items')
          .select('*')
          .eq('wishlist_id', wishlistId)
          .order('created_at', { ascending: false });
        
        if (itemsError) {
          console.error("Error fetching wishlist items:", itemsError);
          // Still show wishlist even if items fail to load
        }
        
        // Transform to match expected Wishlist type with enhanced product source detection
        const transformedWishlist: Wishlist = {
          id: wishlistData.id,
          user_id: wishlistData.user_id,
          title: wishlistData.title,
          description: wishlistData.description || '',
          category: wishlistData.category,
          is_public: wishlistData.is_public,
          created_at: wishlistData.created_at,
          items: (items || []).map(item => {
            // Enhance each item with product source detection for proper pricing
            const baseItem = {
              id: item.id,
              wishlist_id: item.wishlist_id,
              product_id: item.product_id,
              name: item.name,
              title: item.title || item.name,
              brand: item.brand,
              price: item.price,
              image_url: item.image_url,
              added_at: item.created_at,
              created_at: item.created_at,
              vendor: (item as any).vendor,
              retailer: (item as any).retailer,
              isZincApiProduct: (item as any).isZincApiProduct,
              productSource: (item as any).productSource || (item as any).product_source
            };
            
            return enhanceWishlistItemWithSource(baseItem);
          })
        };
        
        const ownerInfo = {
          name: wishlistData.profiles.name,
          image: wishlistData.profiles.profile_image,
          id: wishlistData.profiles.id
        };
        
        setWishlist(transformedWishlist);
        setOwnerProfile(ownerInfo);
        
      } catch (error) {
        console.error("Error fetching shared wishlist:", error);
        toast.error("Failed to load wishlist");
      } finally {
        setLoading(false);
      }
    };

    fetchSharedWishlist();
  }, [wishlistId, user?.id]);

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <SharedWishlistSkeleton />
      </div>
    );
  }

  if (!wishlist) {
    return (
      <div className="container mx-auto py-8 px-4">
        <NoWishlistFound />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <SharedWishlistView wishlist={wishlist} owner={ownerProfile} />
    </div>
  );
};

export default SharedWishlist;
