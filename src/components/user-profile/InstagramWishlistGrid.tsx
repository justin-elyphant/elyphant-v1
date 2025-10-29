import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Wishlist } from "@/types/profile";
import InstagramWishlistCard from "./InstagramWishlistCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import WishlistPriceRange from "./WishlistPriceRange";

interface InstagramWishlistGridProps {
  profileId: string;
  isOwnProfile: boolean;
  isPreviewMode?: boolean;
  onWishlistsLoaded?: (wishlists: Wishlist[]) => void;
  wishlistItems?: Array<{ price?: number }>;
}

const InstagramWishlistGrid: React.FC<InstagramWishlistGridProps> = ({
  profileId,
  isOwnProfile,
  isPreviewMode = false,
  onWishlistsLoaded,
  wishlistItems = []
}) => {
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchWishlists = async () => {
      try {
        setLoading(true);
        
        // Fetch wishlists from the wishlists table
        const query = supabase
          .from('wishlists')
          .select(`
            *,
            wishlist_items(*)
          `)
          .eq('user_id', profileId)
          .order('updated_at', { ascending: false });
        
        // Filter by public status if not own profile
        if (!isOwnProfile) {
          query.eq('is_public', true);
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error('Error fetching wishlists:', error);
          return;
        }
        
        // Transform the data to match Wishlist type
        const transformedWishlists: Wishlist[] = (data || []).map(wishlist => ({
          id: wishlist.id,
          user_id: wishlist.user_id,
          title: wishlist.title,
          description: wishlist.description || '',
          category: wishlist.category,
          is_public: wishlist.is_public,
          created_at: wishlist.created_at,
          updated_at: wishlist.updated_at,
          cover_image: (wishlist as any).cover_image, // Optional field - may not exist in DB yet
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
        
        setWishlists(transformedWishlists);
        
        // Notify parent component with wishlist data
        if (onWishlistsLoaded) {
          onWishlistsLoaded(transformedWishlists);
        }
      } catch (error) {
        console.error('Error fetching wishlists:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWishlists();
  }, [profileId, isOwnProfile]);
  
  if (loading) {
    return (
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1 md:gap-2">
        {[...Array(12)].map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-sm" />
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
        <h2 className="text-xl font-bold">Wishlists</h2>
        {isOwnProfile && !isPreviewMode && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/wishlists')}
          >
            Manage
          </Button>
        )}
      </div>
      {/* Price Range Summary for Visitors */}
      {!isOwnProfile && wishlistItems.length > 0 && (
        <div className="mb-3">
          <WishlistPriceRange items={wishlistItems} />
        </div>
      )}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1 md:gap-2">
        {wishlists.map((wishlist) => (
          <InstagramWishlistCard
            key={wishlist.id}
            wishlist={wishlist}
            isOwnProfile={isOwnProfile}
            onClick={() => navigate(`/wishlist/${wishlist.id}`)}
          />
        ))}
      </div>
    </div>
  );
};

export default InstagramWishlistGrid;
