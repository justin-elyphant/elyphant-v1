import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Wishlist } from "@/types/profile";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";
import SharedWishlistSkeleton from "@/components/gifting/wishlist/SharedWishlistSkeleton";
import NoWishlistFound from "@/components/gifting/wishlist/NoWishlistFound";
import WishlistWorkspaceHeader from "@/components/gifting/wishlist/workspace/WishlistWorkspaceHeader";
import WishlistSidebar from "@/components/gifting/wishlist/workspace/WishlistSidebar";
import WishlistItemsGrid from "@/components/gifting/wishlist/WishlistItemsGrid";
import ShoppingPanel from "@/components/gifting/wishlist/shopping/ShoppingPanel";
import { useWishlist } from "@/components/gifting/hooks/useWishlist";
import { enhanceWishlistItemWithSource } from "@/utils/productSourceDetection";
import { useIsMobile } from "@/hooks/use-mobile";

const WishlistWorkspace = () => {
  const { wishlistId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [ownerProfile, setOwnerProfile] = useState<any | null>(null);
  const [isGuestPreview, setIsGuestPreview] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isShoppingPanelOpen, setIsShoppingPanelOpen] = useState(false);
  
  const { removeFromWishlist, isRemoving } = useWishlist();
  
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
          navigate('/wishlists');
          return;
        }
        
        const canAccess = user?.id === wishlistData.user_id || wishlistData.is_public;
        
        if (!canAccess) {
          toast.error("This wishlist is private");
          navigate('/wishlists');
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
  }, [wishlistId, user?.id, navigate]);

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

  const filteredItems = selectedCategory 
    ? wishlist.items.filter(item => {
        const itemBrand = item.brand?.toLowerCase() || '';
        const itemName = (item.name || item.title || '').toLowerCase();
        return itemBrand.includes(selectedCategory.toLowerCase()) || 
               itemName.includes(selectedCategory.toLowerCase());
      })
    : wishlist.items;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <WishlistWorkspaceHeader
        wishlist={wishlist}
        ownerProfile={ownerProfile}
        isOwner={isOwner}
        isGuestPreview={isGuestPreview}
        onToggleGuestPreview={() => setIsGuestPreview(!isGuestPreview)}
        onAddItems={() => setIsShoppingPanelOpen(true)}
      />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar - Desktop only */}
          {!isMobile && isOwner && !isGuestPreview && (
            <WishlistSidebar
              wishlist={wishlist}
              selectedCategory={selectedCategory}
              onCategorySelect={setSelectedCategory}
            />
          )}

          {/* Main Content Area */}
          <div className="flex-1">
            <WishlistItemsGrid
              items={filteredItems}
              onSaveItem={(item) => handleRemoveItem(item.id)}
              savingItemId={isRemoving ? 'removing' : undefined}
            />
          </div>
        </div>
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
    </div>
  );
};

export default WishlistWorkspace;
