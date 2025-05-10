
import React, { useState } from "react";
import { useWishlist } from "@/components/gifting/hooks/useWishlist";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Loader2, PlusCircle, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
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
  const { wishlists, addToWishlist } = useWishlist();
  const [open, setOpen] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState<string | null>(null);
  const navigate = useNavigate();

  // Check which wishlists already contain this product
  const isInWishlist = (wishlistId: string) => {
    const wishlist = wishlists.find((w) => w.id === wishlistId);
    return wishlist?.items.some((item) => item.product_id === productId);
  };

  const handleAddToWishlist = async (wishlistId: string) => {
    try {
      setAddingToWishlist(wishlistId);
      await addToWishlist(wishlistId, {
        product_id: productId,
        name: productName,
        price: productPrice,
        image_url: productImage,
        brand: productBrand
      });
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

  const handleCreateWishlist = () => {
    navigate("/wishlists");
    if (onClose) onClose();
    setOpen(false);
  };

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
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <h4 className="font-medium">Add to Wishlist</h4>
          <p className="text-sm text-muted-foreground mt-1">
            Select a wishlist to add this item to
          </p>
        </div>
        
        <div className="max-h-60 overflow-y-auto divide-y">
          {wishlists?.length > 0 ? (
            wishlists.map((wishlist) => {
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
        
        <div className="p-3 border-t">
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-center"
            onClick={handleCreateWishlist}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Create New Wishlist
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default WishlistSelectionPopover;
