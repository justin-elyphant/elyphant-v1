
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useUnifiedWishlist } from "@/hooks/useUnifiedWishlist";

// Core extracted logic for WishlistSelectionPopover
export const useWishlistPopoverLogic = ({
  productId,
  productName,
  productImage,
  productPrice,
  productBrand,
  onClose
}: {
  productId: string;
  productName: string;
  productImage?: string;
  productPrice?: number;
  productBrand?: string;
  onClose?: () => void;
}) => {
  const { wishlists, addToWishlist, createWishlistWithItem, loadWishlists } = useUnifiedWishlist();
  const [open, setOpen] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState<string | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const isInWishlist = (wishlistId: string) => {
    const wishlist = wishlists.find((w) => w.id === wishlistId);
    return wishlist?.items?.some((item) => item.product_id === productId) || false;
  };

  const handleAddToWishlist = async (wishlistId: string) => {
    try {
      setAddingToWishlist(wishlistId);
      
      const success = await addToWishlist(wishlistId, {
        id: productId,
        title: productName,
        name: productName,
        price: productPrice,
        image: productImage,
        brand: productBrand
      });

      if (success) {
        console.log('useWishlistPopoverLogic - Successfully added to wishlist, reloading data');
        // Reload wishlists to ensure fresh data
        await loadWishlists();
        toast.success(`Added to wishlist`);
        
        // Close popover and trigger callback
        if (onClose) {
          onClose();
        }
        setOpen(false);
      }
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      toast.error("Failed to add to wishlist");
    } finally {
      setAddingToWishlist(null);
    }
  };

  const handleCreateWishlist = async () => {
    if (!newName.trim()) {
      toast.error("Please enter a name for your wishlist");
      return;
    }
    
    try {
      setCreating(true);
      
      console.log('Creating new wishlist with product:', newName.trim());
      
      // Create wishlist with the product already included to avoid race condition
      const productData = {
        id: productId,
        title: productName,
        name: productName,
        price: productPrice,
        image: productImage,
        brand: productBrand
      };

      const newWishlist = await createWishlistWithItem(newName.trim(), productData);
      
      if (newWishlist) {
        console.log('New wishlist created successfully with product:', newWishlist.id);
        toast.success(`Created "${newName.trim()}" and added item`);
        
        // Close dialogs and trigger callback
        setShowNewDialog(false);
        setNewName("");
        
        if (onClose) {
          onClose();
        }
        setOpen(false);
      } else {
        console.error('Failed to create wishlist with product');
        toast.error("Failed to create wishlist");
      }
    } catch (err) {
      console.error('Error in handleCreateWishlist:', err);
      toast.error("Failed to create wishlist");
    } finally {
      setCreating(false);
    }
  };

  return {
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
  };
};
