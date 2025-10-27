
import React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Check, Plus, Loader2, Trash2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
    removingFromWishlist,
    showNewDialog,
    setShowNewDialog,
    newName,
    setNewName,
    creating,
    showRemoveConfirm,
    setShowRemoveConfirm,
    wishlistToRemoveFrom,
    showRemoveAllConfirm,
    setShowRemoveAllConfirm,
    wishlistsContainingProduct,
    productIsWishlisted,
    isInWishlist,
    handleAddToWishlist,
    handleRemoveFromWishlist,
    handleRemoveFromAllWishlists,
    handleCreateWishlist,
    confirmRemoveFromWishlist,
    confirmRemoveFromAllWishlists
  } = useWishlistPopoverLogic({
    productId,
    productName,
    productImage,
    productPrice,
    productBrand,
    onClose: () => {
      console.log('WishlistSelectionPopover - onClose callback triggered');
      if (onClose) onClose();
      setOpen(false);
    }
  });

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {trigger}
        </PopoverTrigger>
        <PopoverContent className={`w-80 p-0 ${className}`} align="end">
          <div className="p-3 border-b">
            <h4 className="font-medium">
              {productIsWishlisted ? "Manage Wishlist" : "Add to Wishlist"}
            </h4>
            <p className="text-sm text-muted-foreground mt-1">{productName}</p>
          </div>
          
          {productIsWishlisted ? (
            // Show removal options when product is wishlisted
            <div className="max-h-60 overflow-y-auto">
              <div className="p-3 space-y-2">
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  This item is in {wishlistsContainingProduct.length} wishlist{wishlistsContainingProduct.length > 1 ? 's' : ''}:
                </p>
                
                {wishlistsContainingProduct.map((wishlist) => {
                  const isRemoving = removingFromWishlist === wishlist.id;
                  
                  return (
                    <div key={wishlist.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{wishlist.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {wishlist.items?.length || 0} items
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => confirmRemoveFromWishlist(wishlist.id, wishlist.title)}
                        disabled={isRemoving || removingFromWishlist === 'all'}
                        className="h-7"
                      >
                        {isRemoving ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="h-3 w-3 mr-1" />
                            Remove
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}
                
                {wishlistsContainingProduct.length > 1 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={confirmRemoveFromAllWishlists}
                    disabled={removingFromWishlist !== null}
                    className="w-full mt-2"
                  >
                    {removingFromWishlist === 'all' ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-2" />
                    ) : (
                      <Trash2 className="h-3 w-3 mr-2" />
                    )}
                    Remove from All ({wishlistsContainingProduct.length})
                  </Button>
                )}
              </div>
            </div>
          ) : (
            // Show add to wishlist options when product is not wishlisted
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
                            type="button"
                            size="sm"
                            onPointerDown={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              console.log('Add button clicked for wishlist:', wishlist.id);
                              handleAddToWishlist(wishlist.id);
                            }}
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
          )}
          
          {!productIsWishlisted && (
            <>
              <Separator />
              <div className="p-3">
                <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
                  <DialogTrigger asChild>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onPointerDown={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
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
            </>
          )}
        </PopoverContent>
      </Popover>

      {/* Remove from specific wishlist confirmation */}
      <AlertDialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Remove from Wishlist
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{productName}" from "{wishlistToRemoveFrom?.name}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removingFromWishlist !== null}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (wishlistToRemoveFrom) {
                  handleRemoveFromWishlist(wishlistToRemoveFrom.id, wishlistToRemoveFrom.name);
                }
              }}
              disabled={removingFromWishlist !== null}
              className="bg-red-600 hover:bg-red-700"
            >
              {removingFromWishlist ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove from all wishlists confirmation */}
      <AlertDialog open={showRemoveAllConfirm} onOpenChange={setShowRemoveAllConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Remove from All Wishlists
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{productName}" from all {wishlistsContainingProduct.length} wishlists?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removingFromWishlist !== null}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveFromAllWishlists}
              disabled={removingFromWishlist !== null}
              className="bg-red-600 hover:bg-red-700"
            >
              {removingFromWishlist === 'all' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Remove from All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default WishlistSelectionPopover;
