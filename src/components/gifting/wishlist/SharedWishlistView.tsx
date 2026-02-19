import React, { useState, useEffect, useMemo } from "react";
import { Wishlist, WishlistItem } from "@/types/profile";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import WishlistItemsGrid from "./WishlistItemsGrid";
import WishlistOwnerHero from "./WishlistOwnerHero";
import GuestWishlistCTA from "./GuestWishlistCTA";
import GiftCartFloatingBar from "./GiftCartFloatingBar";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { convertWishlistItemToProduct, calculateWishlistTotal } from "@/utils/wishlistConversions";
import { toast } from "sonner";
import { triggerHapticFeedback } from "@/utils/haptics";

interface SharedWishlistViewProps {
  wishlist: Wishlist;
  owner: {
    name: string;
    image?: string;
    id: string;
    bio?: string;
    location?: string;
    shippingAddress?: any; // Owner's shipping address for registry-style fulfillment
  };
}

const SharedWishlistView: React.FC<SharedWishlistViewProps> = ({ 
  wishlist,
  owner
}) => {
  const { addToCart, cartItems, cartTotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [purchasedItemIds, setPurchasedItemIds] = useState<Set<string>>(new Set());
  const [isAddingAll, setIsAddingAll] = useState(false);
  const [showFloatingBar, setShowFloatingBar] = useState(false);
  const [addedItemCount, setAddedItemCount] = useState(0);
  
  // Check if the current user is the wishlist owner (buying from their own wishlist)
  const isOwnWishlist = user?.id === owner.id;

  // Fetch purchased items on mount
  useEffect(() => {
    const fetchPurchasedItems = async () => {
      const { data, error } = await supabase
        .from("wishlist_item_purchases")
        .select("item_id")
        .eq("wishlist_id", wishlist.id);

      if (!error && data) {
        setPurchasedItemIds(new Set(data.map((row) => row.item_id)));
      }
    };

    fetchPurchasedItems();
  }, [wishlist.id]);

  // Calculate available items (not purchased)
  const availableItems = useMemo(() => {
    return wishlist.items.filter(item => !purchasedItemIds.has(item.id));
  }, [wishlist.items, purchasedItemIds]);

  // Calculate total price of available items
  const totalPrice = useMemo(() => {
    return calculateWishlistTotal(availableItems);
  }, [availableItems]);

  // Handle adding a single item to cart
  const handleAddToCart = async (item: WishlistItem) => {
    triggerHapticFeedback('success');
    try {
      const product = convertWishlistItemToProduct(item, wishlist.id);
      
      // Debug logging for wishlist flow
      console.log('[SharedWishlist] Adding to cart with metadata:', {
        wishlist_id: wishlist.id,
        owner_id: owner.id,
        owner_name: owner.name,
        has_shipping: !!owner.shippingAddress,
        shipping_city: owner.shippingAddress?.city,
        is_own_wishlist: isOwnWishlist
      });
      
      // Only include owner shipping if NOT the owner viewing their own list
      // (If owner is buying from their own wishlist, they ship to themselves via normal flow)
      const metadata = {
        wishlist_id: wishlist.id,
        wishlist_item_id: item.id,
        ...(isOwnWishlist ? {} : {
          wishlist_owner_id: owner.id,
          wishlist_owner_name: owner.name,
          wishlist_owner_shipping: owner.shippingAddress,
        })
      };
      
      await addToCart(product, 1, metadata);
      
      setAddedItemCount(prev => prev + 1);
      setShowFloatingBar(true);
      
      toast.success("Added to cart");
    } catch (error) {
      console.error("Failed to add item to cart:", error);
      toast.error("Failed to add to cart");
    }
  };

  // Handle adding all items to cart
  const handleAddAllToCart = async () => {
    triggerHapticFeedback('success');
    setIsAddingAll(true);
    
    try {
      for (const item of availableItems) {
        const product = convertWishlistItemToProduct(item, wishlist.id);
        
        // Only include owner shipping if NOT the owner viewing their own list
        const metadata = {
          wishlist_id: wishlist.id,
          wishlist_item_id: item.id,
          ...(isOwnWishlist ? {} : {
            wishlist_owner_id: owner.id,
            wishlist_owner_name: owner.name,
            wishlist_owner_shipping: owner.shippingAddress,
          })
        };
        
        await addToCart(product, 1, metadata);
      }
      
      setAddedItemCount(availableItems.length);
      setShowFloatingBar(true);
      
      toast.success(`Added ${availableItems.length} items to cart`);
    } catch (error) {
      console.error("Failed to add items to cart:", error);
      toast.error("Failed to add items to cart");
    } finally {
      setIsAddingAll(false);
    }
  };

  return (
    <div className="pb-24 md:pb-8">
      {/* Back Navigation - Subtle on all platforms */}
      <div className="mb-4">
        <Link 
          to="/wishlists" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors touch-manipulation min-h-[44px] md:min-h-0"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Browse wishlists
        </Link>
      </div>

      {/* Enhanced Owner Hero Section */}
      <WishlistOwnerHero
        owner={owner}
        wishlist={{
          title: wishlist.title,
          description: wishlist.description,
          category: wishlist.category
        }}
        itemCount={wishlist.items.length}
        totalPrice={totalPrice}
        purchasedCount={purchasedItemIds.size}
        onAddAllToCart={handleAddAllToCart}
        isAdding={isAddingAll}
      />
      
      {/* Wishlist Content - Responsive Grid */}
      <WishlistItemsGrid 
        items={wishlist.items}
        onSaveItem={() => {}}
        savingItemId={null}
        isOwner={isOwnWishlist}
        isGuestPreview={!isOwnWishlist}
        onAddToCart={handleAddToCart}
        purchasedItemIds={purchasedItemIds}
      />

      {/* Guest Signup CTA - After product grid */}
      <GuestWishlistCTA ownerName={owner.name} />

      {/* Floating Cart Bar */}
      <GiftCartFloatingBar
        itemCount={addedItemCount}
        totalPrice={cartTotal}
        wishlistOwnerName={owner.name}
        isVisible={showFloatingBar}
        onClose={() => setShowFloatingBar(false)}
      />
    </div>
  );
};

export default SharedWishlistView;
