
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
  const { wishlists, addToWishlist, createWishlist, loadWishlists } = useUnifiedWishlist();
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
      
      console.log('Creating new wishlist:', newName.trim());
      
      // Create wishlist and get the returned object
      const newWishlist = await createWishlist(newName.trim());
      if (!newWishlist) {
        toast.error("Failed to create wishlist");
        return;
      }

      console.log('New wishlist created successfully:', newWishlist.id);
      
      // Use the returned wishlist object directly instead of reloading state
      const productData = {
        id: productId,
        title: productName,
        name: productName,
        price: productPrice,
        image: productImage,
        brand: productBrand
      };

      console.log('Adding product to newly created wishlist:', newWishlist.id);
      
      // Add product directly to the new wishlist using its ID
      const success = await addToWishlist(newWishlist.id, productData);
      
      if (success) {
        console.log('Product added successfully to new wishlist');
        toast.success(`Created "${newName.trim()}" and added item`);
        
        // Close dialogs and trigger callback
        setShowNewDialog(false);
        setNewName("");
        
        if (onClose) {
          onClose();
        }
        setOpen(false);
      } else {
        console.error('Failed to add product to new wishlist');
        toast.error("Created wishlist but failed to add item");
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
