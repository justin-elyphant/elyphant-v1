import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Wishlist } from "@/types/profile";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";
import SharedWishlistSkeleton from "@/components/gifting/wishlist/SharedWishlistSkeleton";
import NoWishlistFound from "@/components/gifting/wishlist/NoWishlistFound";
import WishlistItemsGrid from "@/components/gifting/wishlist/WishlistItemsGrid";
import ShoppingPanel from "@/components/gifting/wishlist/shopping/ShoppingPanel";
import WishlistActionToolbar from "@/components/gifting/wishlist/workspace/WishlistActionToolbar";
import { useWishlist } from "@/components/gifting/hooks/useWishlist";
import { enhanceWishlistItemWithSource } from "@/utils/productSourceDetection";
import { useIsMobile } from "@/hooks/use-mobile";

interface InlineWishlistWorkspaceProps {
  wishlistId: string;
  onBack: () => void;
}

const InlineWishlistWorkspace: React.FC<InlineWishlistWorkspaceProps> = ({
  wishlistId,
  onBack
}) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [ownerProfile, setOwnerProfile] = useState<any | null>(null);
  const [isGuestPreview, setIsGuestPreview] = useState(false);
  const [isShoppingPanelOpen, setIsShoppingPanelOpen] = useState(false);
  
  const { removeFromWishlist, isRemoving } = useWishlist();
  
  // Handle URL parameters for auto-opening shopping panel
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('openShopping') === 'true') {
      setIsShoppingPanelOpen(true);
    }
  }, []);
  
  const isOwner = user?.id === wishlist?.user_id;

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!wishlistId) return;

      try {
        setLoading(true);
        
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
          toast.error("Wishlist not found");
          onBack();
          return;
        }
        
        const canAccess = user?.id === wishlistData.user_id || wishlistData.is_public;
        
        if (!canAccess) {
          toast.error("This wishlist is private");
          onBack();
          return;
        }
        
        const { data: items, error: itemsError } = await supabase
          .from('wishlist_items')
          .select('*')
          .eq('wishlist_id', wishlistId)
          .order('created_at', { ascending: false });
        
        if (itemsError) {
          console.error("Error fetching wishlist items:", itemsError);
        }
        
        const transformedWishlist: Wishlist = {
          id: wishlistData.id,
          user_id: wishlistData.user_id,
          title: wishlistData.title,
          description: wishlistData.description || '',
          category: wishlistData.category,
          is_public: wishlistData.is_public,
          created_at: wishlistData.created_at,
          items: (items || []).map(item => {
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
        console.error("Error fetching wishlist:", error);
        toast.error("Failed to load wishlist");
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [wishlistId, user?.id, onBack]);

  const handleRemoveItem = async (itemId: string) => {
    if (!wishlistId) return;
    
    try {
      await removeFromWishlist(wishlistId, itemId);
      
      // Update local state
      setWishlist(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.filter(item => item.id !== itemId)
        };
      });
      
      toast.success("Item removed from wishlist");
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("Failed to remove item");
    }
  };

  const handleProductAdded = (newItem: any) => {
    setWishlist(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        items: [newItem, ...prev.items]
      };
    });
  };

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
    <>
      <div className="space-y-6">
        {/* Action Toolbar (only for owners) */}
        {isOwner && (
          <WishlistActionToolbar
            wishlistId={wishlistId}
            ownerId={ownerProfile?.id || ''}
            ownerName={ownerProfile?.name || ''}
            isOwner={isOwner}
            isGuestPreview={isGuestPreview}
            onToggleGuestPreview={() => setIsGuestPreview(!isGuestPreview)}
            onAddItems={() => setIsShoppingPanelOpen(true)}
          />
        )}

        {/* Guest View Notice (for non-owners) */}
        {!isOwner && (
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <p className="text-sm text-center font-medium">
              You're viewing {ownerProfile?.name}'s wishlist
            </p>
          </div>
        )}
        
        {/* Items Grid - Full Width */}
        <WishlistItemsGrid
          items={wishlist.items}
          onSaveItem={(item) => handleRemoveItem(item.id)}
          savingItemId={isRemoving ? 'removing' : undefined}
          isOwner={isOwner}
          isGuestPreview={isGuestPreview}
        />
      </div>

      {/* Shopping Panel */}
      {isOwner && !isGuestPreview && (
        <ShoppingPanel
          isOpen={isShoppingPanelOpen}
          onClose={() => setIsShoppingPanelOpen(false)}
          wishlistId={wishlistId || ''}
          onProductAdded={handleProductAdded}
        />
      )}
    </>
  );
};

export default InlineWishlistWorkspace;
