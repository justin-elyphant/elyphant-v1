import React, { useState, useEffect, useMemo } from "react";
import { Wishlist, WishlistItem } from "@/types/profile";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Calendar, Gift, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import WishlistItemsGrid from "./WishlistItemsGrid";
import WishlistOwnerHero from "./WishlistOwnerHero";
import GuestWishlistCTA from "./GuestWishlistCTA";
import GiftCartFloatingBar from "./GiftCartFloatingBar";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
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
    shippingAddress?: any;
  };
}

const SharedWishlistView: React.FC<SharedWishlistViewProps> = ({ 
  wishlist,
  owner
}) => {
  const { addToCart, cartItems, cartTotal, updateRecipientAssignment } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [purchasedItemIds, setPurchasedItemIds] = useState<Set<string>>(new Set());
  const [isAddingAll, setIsAddingAll] = useState(false);
  const [showFloatingBar, setShowFloatingBar] = useState(false);
  const [addedItemCount, setAddedItemCount] = useState(0);

  // Gift Options Drawer state
  const [giftOptionsItem, setGiftOptionsItem] = useState<WishlistItem | null>(null);
  const [pendingGiftNote, setPendingGiftNote] = useState('');
  const [pendingScheduledDate, setPendingScheduledDate] = useState('');
  const [isGiftDrawerOpen, setIsGiftDrawerOpen] = useState(false);

  // Check if the current user is the wishlist owner
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

  // Today + 1 day minimum for scheduling
  const minDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  })();

  // Core add-to-cart logic (called directly or after gift options)
  const doAddToCart = async (
    item: WishlistItem,
    giftNote?: string,
    scheduledDate?: string
  ) => {
    triggerHapticFeedback('success');
    try {
      const product = convertWishlistItemToProduct(item, wishlist.id);

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

      // If guest is gifting (not own wishlist), attach gift note + scheduled date
      // so they flow through recipientAssignment → Stripe metadata → Zinc
      if (!isOwnWishlist && (giftNote || scheduledDate)) {
        const productId = product.product_id || product.id || item.product_id || item.id;
        updateRecipientAssignment(productId, {
          connectionId: owner.id,
          connectionName: owner.name,
          deliveryGroupId: `wishlist_${wishlist.id}`,
          giftMessage: giftNote || '',
          scheduledDeliveryDate: scheduledDate || '',
        });
      }

      setAddedItemCount(prev => prev + 1);
      setShowFloatingBar(true);
      toast.success("Added to cart");
    } catch (error) {
      console.error("Failed to add item to cart:", error);
      toast.error("Failed to add to cart");
    }
  };

  // Simple add to cart (no options)
  const handleAddToCart = async (item: WishlistItem) => {
    await doAddToCart(item);
  };

  // Open gift options drawer then add to cart
  const handleScheduleAndAddToCart = (item: WishlistItem) => {
    setGiftOptionsItem(item);
    setPendingGiftNote('');
    setPendingScheduledDate('');
    setIsGiftDrawerOpen(true);
  };

  // Confirm from drawer: add to cart with options
  const handleConfirmGiftOptions = async () => {
    if (!giftOptionsItem) return;
    setIsGiftDrawerOpen(false);
    await doAddToCart(giftOptionsItem, pendingGiftNote, pendingScheduledDate);
    setGiftOptionsItem(null);
  };

  // Skip options: add immediately without date/note
  const handleSkipAndAdd = async () => {
    if (!giftOptionsItem) return;
    setIsGiftDrawerOpen(false);
    await doAddToCart(giftOptionsItem);
    setGiftOptionsItem(null);
  };

  // Handle adding all items to cart
  const handleAddAllToCart = async () => {
    triggerHapticFeedback('success');
    setIsAddingAll(true);
    
    try {
      for (const item of availableItems) {
        const product = convertWishlistItemToProduct(item, wishlist.id);
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
      {/* Back Navigation */}
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
        onScheduleAndAddToCart={!isOwnWishlist ? handleScheduleAndAddToCart : undefined}
        purchasedItemIds={purchasedItemIds}
      />

      {/* Guest Signup CTA */}
      <GuestWishlistCTA ownerName={owner.name} />

      {/* Floating Cart Bar */}
      <GiftCartFloatingBar
        itemCount={addedItemCount}
        totalPrice={cartTotal}
        wishlistOwnerName={owner.name}
        isVisible={showFloatingBar}
        onClose={() => setShowFloatingBar(false)}
      />

      {/* Gift Options Drawer */}
      <Drawer open={isGiftDrawerOpen} onOpenChange={setIsGiftDrawerOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <DrawerTitle className="flex items-center gap-2">
                <Gift className="h-4 w-4" />
                Gift options for {owner.name}
              </DrawerTitle>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>
            {giftOptionsItem && (
              <p className="text-sm text-muted-foreground text-left mt-1 line-clamp-1">
                {giftOptionsItem.name || giftOptionsItem.title}
              </p>
            )}
          </DrawerHeader>

          <div className="p-4 space-y-5 overflow-y-auto">
            {/* Schedule Delivery */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Schedule delivery date <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <input
                type="date"
                min={minDate}
                value={pendingScheduledDate}
                onChange={e => setPendingScheduledDate(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              <p className="text-xs text-muted-foreground">
                Funds will be held and released on the scheduled date
              </p>
            </div>

            {/* Gift Note */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Gift note <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Textarea
                placeholder={`Write a personal message for ${owner.name}...`}
                value={pendingGiftNote}
                onChange={e => setPendingGiftNote(e.target.value.slice(0, 240))}
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {pendingGiftNote.length}/240 · Included with the gift
              </p>
            </div>
          </div>

          <DrawerFooter className="border-t pt-4 pb-safe">
            <Button
              onClick={handleConfirmGiftOptions}
              className="w-full min-h-[44px]"
            >
              Add to Cart
            </Button>
            <button
              onClick={handleSkipAndAdd}
              className="text-sm text-muted-foreground hover:text-foreground py-2 min-h-[44px]"
            >
              Skip — Add now without options
            </button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default SharedWishlistView;
