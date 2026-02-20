import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Wishlist } from "@/types/profile";
import InstagramWishlistCard from "./InstagramWishlistCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import WishlistPriceRange from "./WishlistPriceRange";
import { useUnifiedWishlistSystem } from "@/hooks/useUnifiedWishlistSystem";
import { motion } from "framer-motion";
import { triggerHapticFeedback, HapticPatterns } from "@/utils/haptics";
import { Lock } from "lucide-react";

interface InstagramWishlistGridProps {
  profileId: string;
  isOwnProfile: boolean;
  isPreviewMode?: boolean;
  onWishlistsLoaded?: (wishlists: Wishlist[]) => void;
  wishlistItems?: Array<{ price?: number }>;
  displayName?: string;
  onWishlistClick?: (wishlist: Wishlist) => void;
  /** Pass the profile owner's wishlist_visibility setting for enforcement */
  wishlistVisibility?: 'public' | 'connections_only' | 'private';
  isConnected?: boolean;
}

const InstagramWishlistGrid: React.FC<InstagramWishlistGridProps> = ({
  profileId,
  isOwnProfile,
  isPreviewMode = false,
  onWishlistsLoaded,
  wishlistItems = [],
  displayName = "Their",
  onWishlistClick,
  wishlistVisibility = 'public',
  isConnected = false
}) => {
  const navigate = useNavigate();
  const [publicWishlists, setPublicWishlists] = useState<Wishlist[]>([]);
  const [loadingPublic, setLoadingPublic] = useState(false);
  
  // Use unified system for own profile (with real-time updates)
  const { wishlists: ownWishlists, loading: loadingOwn } = useUnifiedWishlistSystem();
  
  // Fetch public wishlists for other profiles
  useEffect(() => {
    const fetchPublicWishlists = async () => {
      if (isOwnProfile) return; // Skip for own profile
      
      try {
        setLoadingPublic(true);
        
        const { data, error } = await supabase
          .from('wishlists')
          .select(`
            *,
            wishlist_items(*)
          `)
          .eq('user_id', profileId)
          .eq('is_public', true)
          .order('updated_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching public wishlists:', error);
          return;
        }
        
        const transformedWishlists: Wishlist[] = (data || []).map(wishlist => ({
          id: wishlist.id,
          user_id: wishlist.user_id,
          title: wishlist.title,
          description: wishlist.description || '',
          category: wishlist.category,
          is_public: wishlist.is_public,
          created_at: wishlist.created_at,
          updated_at: wishlist.updated_at,
          cover_image: (wishlist as any).cover_image,
          items: (wishlist.wishlist_items || []).map((item: any) => ({
            id: item.id,
            wishlist_id: item.wishlist_id,
            product_id: item.product_id,
            title: item.title || item.name,
            name: item.name,
            brand: item.brand,
            price: item.price,
            image_url: item.image_url,
            created_at: item.created_at,
            added_at: item.created_at
          }))
        }));
        
        setPublicWishlists(transformedWishlists);
      } catch (error) {
        console.error('Error fetching public wishlists:', error);
      } finally {
        setLoadingPublic(false);
      }
    };
    
    fetchPublicWishlists();
  }, [profileId, isOwnProfile]);
  
  // Determine which wishlists to use
  const wishlists = isOwnProfile ? ownWishlists : publicWishlists;
  const loading = isOwnProfile ? loadingOwn : loadingPublic;
  
  // Notify parent component when wishlists are loaded
  useEffect(() => {
    if (!loading && onWishlistsLoaded) {
      onWishlistsLoaded(wishlists);
    }
  }, [wishlists, loading, onWishlistsLoaded]);

  // Enforce wishlist_visibility for non-owners
  const canViewWishlists = isOwnProfile || 
    wishlistVisibility === 'public' || 
    (wishlistVisibility === 'connections_only' && isConnected);

  if (!isOwnProfile && !canViewWishlists) {
    return (
      <div className="text-center py-12 px-4">
        <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">
          {wishlistVisibility === 'connections_only'
            ? `Connect with ${displayName} to view their wishlists`
            : "This user's wishlists are private"}
        </p>
      </div>
    );
  }

  const handleManageClick = () => {
    triggerHapticFeedback(HapticPatterns.buttonTap);
    navigate('/wishlists');
  };
  
  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto scrollbar-none py-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex flex-col items-center flex-shrink-0">
            <Skeleton className="w-24 h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full" />
            <Skeleton className="w-20 h-3 mt-2 rounded" />
          </div>
        ))}
      </div>
    );
  }
  
  if (wishlists.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {isOwnProfile 
            ? "You haven't created any wishlists yet. Start building your first wishlist!"
            : "This user hasn't shared any wishlists yet."}
        </p>
      </div>
    );
  }
  
  return (
    <div className="w-full px-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold">
          {isOwnProfile ? "My Wishlists" : `${displayName}'s Wishlists`}
        </h2>
        {isOwnProfile && !isPreviewMode && (
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button
              variant="outline"
              size="sm"
              onClick={handleManageClick}
              className="min-h-[44px]"
            >
              Manage
            </Button>
          </motion.div>
        )}
      </div>
      {/* Price Range Summary for Visitors */}
      {!isOwnProfile && wishlistItems.length > 0 && (
        <div className="mb-3">
          <WishlistPriceRange items={wishlistItems} />
        </div>
      )}
      {/* Horizontal Scrollable Row of Circular Highlights */}
      <div className="relative">
        <div 
          className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-none py-2 snap-x snap-mandatory"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {wishlists.map((wishlist) => {
            const handleWishlistClick = (wishlist: Wishlist) => {
              if (isOwnProfile) {
                // Navigate to wishlist workspace for owner
                navigate(`/wishlists?wishlist=${wishlist.id}&view=home`);
              } else {
                // Navigate to the full shared wishlist page for visitors
                navigate(`/shared-wishlist/${wishlist.id}`);
              }
            };

            return (
              <InstagramWishlistCard
                key={wishlist.id}
                wishlist={wishlist}
                isOwnProfile={isOwnProfile}
                onClick={() => handleWishlistClick(wishlist)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default InstagramWishlistGrid;
