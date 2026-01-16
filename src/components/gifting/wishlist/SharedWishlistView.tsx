import React, { useState, useEffect, useMemo } from "react";
import { Wishlist, WishlistItem } from "@/types/profile";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import WishlistCategoryBadge from "./categories/WishlistCategoryBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import WishlistItemsGrid from "./WishlistItemsGrid";
import GiftActionHeader from "./GiftActionHeader";
import GiftCartFloatingBar from "./GiftCartFloatingBar";
import { normalizeImageUrl } from "@/utils/normalizeImageUrl";
import { useCart } from "@/contexts/CartContext";
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
  };
}

const SharedWishlistView: React.FC<SharedWishlistViewProps> = ({ 
  wishlist,
  owner
}) => {
  const { addToCart, cartItems, cartTotal } = useCart();
  const navigate = useNavigate();
  const [purchasedItemIds, setPurchasedItemIds] = useState<Set<string>>(new Set());
  const [isAddingAll, setIsAddingAll] = useState(false);
  const [showFloatingBar, setShowFloatingBar] = useState(false);
  const [addedItemCount, setAddedItemCount] = useState(0);

  const wishlistDate = new Date(wishlist.created_at);
  const formattedDate = format(wishlistDate, "MMMM d, yyyy");

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
      await addToCart(product, 1, {
        wishlist_id: wishlist.id,
        wishlist_item_id: item.id,
      });
      
      setAddedItemCount(prev => prev + 1);
      setShowFloatingBar(true);
      
      toast.success(`Added to cart`, {
        description: "Create an account to track delivery",
        action: {
          label: "Sign Up",
          onClick: () => navigate("/auth/signup?return=/cart"),
        },
      });
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
        await addToCart(product, 1, {
          wishlist_id: wishlist.id,
          wishlist_item_id: item.id,
        });
      }
      
      setAddedItemCount(availableItems.length);
      setShowFloatingBar(true);
      
      toast.success(`Added ${availableItems.length} items to cart`, {
        description: "Create an account to track delivery",
        action: {
          label: "Sign Up",
          onClick: () => navigate("/auth/signup?return=/cart"),
        },
      });
    } catch (error) {
      console.error("Failed to add items to cart:", error);
      toast.error("Failed to add items to cart");
    } finally {
      setIsAddingAll(false);
    }
  };

  return (
    <div className="pb-24">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <Link to="/wishlists" className="flex items-center text-sm text-muted-foreground mb-2 hover:text-foreground transition-colors">
            <ArrowLeft className="h-3 w-3 mr-1" />
            Back to wishlists
          </Link>
          
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold">{wishlist.title}</h1>
            {wishlist.category && (
              <WishlistCategoryBadge category={wishlist.category} />
            )}
          </div>
          
          {wishlist.description && (
            <p className="text-muted-foreground mt-2">{wishlist.description}</p>
          )}
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center">
            <Avatar className="h-8 w-8 mr-2">
              <AvatarImage 
                src={normalizeImageUrl(owner.image, { bucket: 'avatars' })}
                onError={(e) => {
                  console.warn('Failed to load owner avatar:', owner.image);
                  e.currentTarget.style.display = 'none';
                }}
              />
              <AvatarFallback>{owner.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm font-medium">{owner.name}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 mr-1" />
                {formattedDate}
              </div>
            </div>
          </div>
          
          <Link to={`/user/${owner.id}`}>
            <Button size="sm" variant="outline" className="flex items-center gap-1">
              <User className="h-3 w-3 mr-1" />
              View Profile
            </Button>
          </Link>
        </div>
      </div>

      {/* Gift Action Header - Add All to Cart CTA */}
      <GiftActionHeader
        ownerName={owner.name}
        itemCount={wishlist.items.length}
        totalPrice={totalPrice}
        purchasedCount={purchasedItemIds.size}
        onAddAllToCart={handleAddAllToCart}
        isAdding={isAddingAll}
      />
      
      {/* Wishlist Content */}
      <WishlistItemsGrid 
        items={wishlist.items}
        onSaveItem={() => {}}
        savingItemId={null}
        isOwner={false}
        isGuestPreview={true}
        onAddToCart={handleAddToCart}
        purchasedItemIds={purchasedItemIds}
      />

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
