
import React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Check, Plus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useWishlistPopoverLogic } from "./hooks/useWishlistPopoverLogic";

interface WishlistSelectionPopoverProps {
  productId: string;
  productName: string;
  productImage?: string;
  productPrice?: number;
  productBrand?: string;
  trigger: React.ReactNode;
  className?: string;
  onClose?: () => void;
}

const WishlistSelectionPopover: React.FC<WishlistSelectionPopoverProps> = ({
  productId,
  productName,
  productImage,
  productPrice,
  productBrand,
  trigger,
  className,
  onClose,
}) => {
  const {
    wishlists,
    open,
    setOpen,
    addingToWishlist,
    showNewDialog,
    setShowNewDialog,
    newName,
    setNewName,
    creating,
    isInWishlist,
    handleAddToWishlist,
    handleCreateWishlist
  } = useWishlistPopoverLogic({
    productId,
    productName,
    productImage,
    productPrice,
    productBrand,
    onClose: () => {
      if (onClose) onClose();
      setOpen(false);
    }
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger}
      </PopoverTrigger>
      <PopoverContent className={`w-80 p-0 ${className}`} align="end">
        <div className="p-3 border-b">
          <h4 className="font-medium">Add to Wishlist</h4>
          <p className="text-sm text-muted-foreground mt-1">{productName}</p>
        </div>
        
        <div className="max-h-60 overflow-y-auto">
          {wishlists && wishlists.length > 0 ? (
            wishlists.map((wishlist) => {
              const inThisWishlist = isInWishlist(wishlist.id);
              const isAdding = addingToWishlist === wishlist.id;
              
              return (
                <div key={wishlist.id} className="px-3 py-2 hover:bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{wishlist.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {wishlist.items?.length || 0} items
                      </p>
                    </div>
                    {inThisWishlist ? (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Check className="h-4 w-4 mr-1 text-green-600" />
                        Already added
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleAddToWishlist(wishlist.id)}
                        disabled={isAdding}
                        className="h-7"
                      >
                        {isAdding ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          "Add"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              No wishlists yet. Create your first one!
            </div>
          )}
        </div>
        
        <Separator />
        
        <div className="p-3">
          <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                <Plus className="mr-2 h-3 w-3" />
                Create New Wishlist
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Wishlist</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Input
                    placeholder="Enter wishlist name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !creating) {
                        handleCreateWishlist();
                      }
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowNewDialog(false)}
                    className="flex-1"
                    disabled={creating}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateWishlist}
                    className="flex-1"
                    disabled={creating || !newName.trim()}
                  >
                    {creating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Create & Add
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default WishlistSelectionPopover;
