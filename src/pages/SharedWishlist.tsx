
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
import MainLayout from "@/components/layout/MainLayout";
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
        
        // Step 1: Fetch wishlist WITHOUT embedded join (avoids FK relationship issues)
        const { data: wishlistData, error: wishlistError } = await supabase
          .from('wishlists')
          .select('*')
          .eq('id', wishlistId)
          .maybeSingle();
        
        if (wishlistError) {
          console.error("[SharedWishlist] Wishlist fetch error:", wishlistError.code, wishlistError.message);
          return;
        }
        
        if (!wishlistData) {
          console.log("[SharedWishlist] No wishlist found for id:", wishlistId);
          return;
        }
        
        // Check access permissions
        const isOwner = user?.id === wishlistData.user_id;
        const canAccess = isOwner || wishlistData.is_public;
        
        if (!canAccess) {
          console.log("[SharedWishlist] Access denied - not owner and not public");
          return;
        }
        
        // Step 2: Fetch owner profile separately with extended info for shared wishlists
        // Sharing is intentional, so we can show more profile details
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, name, first_name, last_name, profile_image, bio, city, state, username, shipping_address')
          .eq('id', wishlistData.user_id)
          .maybeSingle();
        
        if (profileError) {
          console.error("[SharedWishlist] Profile fetch error:", profileError.code, profileError.message);
          // Continue anyway - we can show wishlist without owner info
        }
        
        // Step 3: Fetch wishlist items
        const { data: items, error: itemsError } = await supabase
          .from('wishlist_items')
          .select('*')
          .eq('wishlist_id', wishlistId)
          .order('created_at', { ascending: false });
        
        if (itemsError) {
          console.error("[SharedWishlist] Items fetch error:", itemsError.code, itemsError.message);
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
        
        // Build display name with fallback logic for shared wishlists
        let displayName = 'A Friend';
        if (profileData) {
          if (profileData.name) {
            displayName = profileData.name;
          } else if (profileData.first_name && profileData.last_name) {
            displayName = `${profileData.first_name} ${profileData.last_name}`;
          } else if (profileData.username) {
            displayName = profileData.username;
          } else if (profileData.first_name) {
            displayName = profileData.first_name;
          }
        }
        
        // Build location string if available
        const location = profileData?.city && profileData?.state 
          ? `${profileData.city}, ${profileData.state}`
          : profileData?.city || profileData?.state || undefined;
        
        const ownerInfo = profileData ? {
          name: displayName,
          image: profileData.profile_image,
          id: profileData.id,
          bio: profileData.bio,
          location: location,
          shippingAddress: profileData.shipping_address
        } : {
          name: displayName,
          image: null,
          id: wishlistData.user_id,
          bio: undefined,
          location: undefined,
          shippingAddress: undefined
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
      <MainLayout>
        <div className="container mx-auto py-6 px-4 lg:py-8 lg:px-6">
          <SharedWishlistSkeleton />
        </div>
      </MainLayout>
    );
  }

  if (!wishlist) {
    return (
      <MainLayout>
        <div className="container mx-auto py-6 px-4 lg:py-8 lg:px-6">
          <NoWishlistFound />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-6 px-4 lg:py-8 lg:px-6">
        <SharedWishlistView wishlist={wishlist} owner={ownerProfile} />
      </div>
    </MainLayout>
  );
};

export default SharedWishlist;
