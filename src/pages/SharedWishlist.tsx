
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
        
        // For demo purposes, we'll fetch from the local user's wishlists
        // In a real implementation, this would be a separate API endpoint
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('wishlists, name, profile_image')
          .eq('id', user?.id)
          .single();
        
        if (profileError) {
          console.error("Error fetching profile:", profileError);
          toast.error("Failed to load wishlist");
          return;
        }
        
        // Find the specific wishlist
        if (profileData?.wishlists && Array.isArray(profileData.wishlists)) {
          const foundWishlist = profileData.wishlists.find(list => list.id === wishlistId);
          if (foundWishlist) {
            setWishlist(foundWishlist);
            setOwnerProfile({
              name: profileData.name,
              image: profileData.profile_image,
              id: user?.id
            });
          } else {
            toast.error("Wishlist not found or is private");
          }
        }
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
