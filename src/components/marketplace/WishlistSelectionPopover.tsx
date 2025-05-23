import React, { useState, useEffect } from "react";
import { useWishlist } from "@/components/gifting/hooks/useWishlist";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Loader2, PlusCircle, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import WishlistCategoryBadge from "../gifting/wishlist/categories/WishlistCategoryBadge";

interface WishlistSelectionPopoverProps {
  productId: string;
  productName: string;
  productImage?: string;
  productPrice?: number;
  productBrand?: string;
  onClose?: () => void;
  trigger?: React.ReactNode;
  className?: string;
}

const WishlistSelectionPopover = ({
  productId,
  productName,
  productImage,
  productPrice,
  productBrand,
  onClose,
  trigger,
  className
}: WishlistSelectionPopoverProps) => {
  const { wishlists, addToWishlist, createWishlist, reloadWishlists } = useWishlist();
  const [open, setOpen] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState<string | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [localWishlists, setLocalWishlists] = useState(wishlists);

  // Sync localWishlists to context wishlists when open
  useEffect(() => {
    if (open) {
      setLocalWishlists(wishlists);
    }
  }, [open, wishlists]);

  // Check which wishlists already contain this product
  const isInWishlist = (wishlistId: string) => {
    const wishlist = localWishlists.find((w) => w.id === wishlistId);
    return wishlist?.items.some((item) => item.product_id === productId);
  };

  const handleAddToWishlist = async (wishlistId: string) => {
    try {
      setAddingToWishlist(wishlistId);
      await addToWishlist(wishlistId, {
        product_id: productId,
        title: productName,
        wishlist_id: wishlistId,
        created_at: new Date().toISOString(),
        name: productName,
        price: productPrice,
        image_url: productImage,
        brand: productBrand
      });
      await reloadWishlists(); // Refresh local wishlists for real-time update
      toast.success(`Added to wishlist`);
      if (onClose) onClose();
      setOpen(false);
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      toast.error("Failed to add to wishlist");
    } finally {
      setAddingToWishlist(null);
    }
  };

  // --- FIXED: async reliable create+add flow ---
  const handleCreateWishlist = async () => {
    if (!newName.trim()) {
      toast.error("Please enter a name for your wishlist");
      return;
    }
    setCreating(true);
    try {
      const newWishlist = await createWishlist(newName.trim());
      if (newWishlist) {
        // Immediately reload wishlists, wait for it
        await reloadWishlists();

        // Find the created wishlist by name (ensure most up-to-date)
        const refreshed = await reloadWishlists();
        let created = null;
        // Try with refetched wishlists, get latest state.
        if (Array.isArray(refreshed)) {
          created = refreshed.find(w => w.title === newName.trim());
        } else {
          created = (wishlists || []).find(w => w.title === newName.trim());
        }

        const newWishId = created?.id || newWishlist.id;
        // Only then add the product to the created wishlist.
        if (newWishId) {
          await handleAddToWishlist(newWishId);
        } else {
          toast.error("Could not find the new wishlist after creation.");
        }
        setShowNewDialog(false);
        setNewName("");
      }
    } catch (err) {
      toast.error("Failed to create wishlist");
    } finally {
      setCreating(false);
    }
  };

  // For mobile: popover stretches full width, close triggers etc.
  const popoverContentClass = cn(
    "p-0",
    className,
    isMobile ? "w-full max-w-none rounded-none border-t border-gray-200 fixed bottom-0 left-0 right-0 min-h-[240px] z-[120]" : "w-80"
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button 
            size="sm" 
            variant="outline"
            className={cn("flex items-center gap-1", className)}
          >
            <Heart className="h-4 w-4" />
            Add to Wishlist
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className={popoverContentClass} align={isMobile ? "center" : "end"} side={isMobile ? "top" : "bottom"}>
        <div className="p-4 border-b flex items-center justify-between">
          <h4 className="font-medium">Add to Wishlist</h4>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className={isMobile ? "" : "hidden"}
          >
            <span className="text-xl">&times;</span>
          </Button>
        </div>
        
        {/* Choose wishlist */}
        <div className="max-h-60 overflow-y-auto divide-y">
          {localWishlists?.length > 0 ? (
            localWishlists.map((wishlist) => {
              const alreadyInWishlist = isInWishlist(wishlist.id);

              return (
                <div 
                  key={wishlist.id} 
                  className={cn(
                    "p-3 hover:bg-muted/50",
                    alreadyInWishlist && "bg-muted/30"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <div className="font-medium text-sm">{wishlist.title}</div>
                      <div className="flex flex-wrap gap-1.5">
                        {wishlist.category && (
                          <WishlistCategoryBadge 
                            category={wishlist.category}
                            size="sm"
                          />
                        )}
                        {alreadyInWishlist && (
                          <Badge variant="secondary" className="text-xs">
                            Already added
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {wishlist.items.length} {wishlist.items.length === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={alreadyInWishlist ? "secondary" : "default"}
                      disabled={alreadyInWishlist || addingToWishlist === wishlist.id}
                      onClick={() => handleAddToWishlist(wishlist.id)}
                    >
                      {addingToWishlist === wishlist.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : alreadyInWishlist ? (
                        "Added"
                      ) : (
                        "Add"
                      )}
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-6 text-center">
              <p className="text-sm text-muted-foreground">
                You don't have any wishlists yet.
              </p>
            </div>
          )}
        </div>

        {/* Create new wishlist inline */}
        {!showNewDialog && (
          <div className="p-3 border-t">
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center"
              onClick={() => setShowNewDialog(true)}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Create New Wishlist
            </Button>
          </div>
        )}
        {showNewDialog && (
          <div className="p-3 border-t">
            <input
              type="text"
              className="input input-bordered w-full mb-2 border-gray-300 rounded px-2 py-2 text-sm"
              placeholder="Wishlist name..."
              value={newName}
              onChange={e => setNewName(e.target.value)}
              disabled={creating}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                disabled={creating}
                onClick={handleCreateWishlist}
              >{creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}</Button>
              <Button
                size="sm"
                variant="secondary"
                className="flex-1"
                onClick={() => setShowNewDialog(false)}
                disabled={creating}
              >Cancel</Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default WishlistSelectionPopover;
