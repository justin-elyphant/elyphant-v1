
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
        
        // First, try to find the wishlist from all public profiles
        // This is a more realistic approach for shared wishlists
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, wishlists, name, profile_image')
          .not('wishlists', 'is', null);
        
        if (profilesError) {
          console.error("Error fetching profiles:", profilesError);
          toast.error("Failed to load wishlist");
          return;
        }
        
        // Find the wishlist across all profiles
        let foundWishlist: any = null;
        let wishlistOwner: any = null;
        
        for (const profileData of profiles || []) {
          if (profileData.wishlists && Array.isArray(profileData.wishlists)) {
            const wishlist = profileData.wishlists.find(list => 
              list.id === wishlistId && list.is_public === true
            );
            if (wishlist) {
              foundWishlist = wishlist;
              wishlistOwner = {
                name: profileData.name,
                image: profileData.profile_image,
                id: profileData.id
              };
              break;
            }
          }
        }
        
        if (foundWishlist && wishlistOwner) {
          setWishlist(foundWishlist);
          setOwnerProfile(wishlistOwner);
        } else {
          toast.error("Wishlist not found or is private");
        }
      } catch (error) {
        console.error("Error fetching shared wishlist:", error);
        toast.error("Failed to load wishlist");
      } finally {
        setLoading(false);
      }
    };

    fetchSharedWishlist();
  }, [wishlistId]);

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <SharedWishlistSkeleton />
      </div>
    );
  }

  if (!wishlist || !wishlist.is_public) {
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
