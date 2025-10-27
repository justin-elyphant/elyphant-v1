
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useUnifiedWishlistSystem } from "@/hooks/useUnifiedWishlistSystem";

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
  const { wishlists, addToWishlist, removeFromWishlist, createWishlistWithItem, loadWishlists } = useUnifiedWishlistSystem();
  const [open, setOpen] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState<string | null>(null);
  const [removingFromWishlist, setRemovingFromWishlist] = useState<string | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [wishlistToRemoveFrom, setWishlistToRemoveFrom] = useState<{id: string, name: string} | null>(null);
  const [showRemoveAllConfirm, setShowRemoveAllConfirm] = useState(false);

  // Get wishlists that contain this product
  const getWishlistsContainingProduct = () => {
    return wishlists.filter(wishlist => 
      wishlist.items?.some(item => item.product_id === productId)
    );
  };

  const wishlistsContainingProduct = getWishlistsContainingProduct();
  const productIsWishlisted = wishlistsContainingProduct.length > 0;

  const isInWishlist = (wishlistId: string) => {
    const wishlist = wishlists.find((w) => w.id === wishlistId);
    return wishlist?.items?.some((item) => item.product_id === productId) || false;
  };

  const handleAddToWishlist = async (wishlistId: string) => {
    console.log('handleAddToWishlist called for wishlistId:', wishlistId);
    console.log('Product details:', { productId, productName, productPrice, productImage, productBrand });
    
    try {
      setAddingToWishlist(wishlistId);
      console.log('Set addingToWishlist state to:', wishlistId);
      
      const itemData = {
        product_id: productId,
        title: productName,
        name: productName,
        price: productPrice,
        image_url: productImage,
        brand: productBrand
      };
      
      console.log('Calling addToWishlist with:', { wishlistId, item: itemData });
      const success = await addToWishlist({ wishlistId, item: itemData });
      console.log('addToWishlist result:', success);

      if (success) {
        console.log('Successfully added to wishlist, reloading data');
        await loadWishlists();
        toast.success(`Added to wishlist`);
        
        if (onClose) {
          console.log('Calling onClose callback');
          onClose();
        }
        setOpen(false);
      } else {
        console.error('addToWishlist returned false');
        toast.error("Failed to add to wishlist");
      }
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      toast.error("Failed to add to wishlist");
    } finally {
      console.log('Clearing addingToWishlist state');
      setAddingToWishlist(null);
    }
  };

  const handleRemoveFromWishlist = async (wishlistId: string, wishlistName: string) => {
    // Find the item in the wishlist to get its ID
    const wishlist = wishlists.find(w => w.id === wishlistId);
    const item = wishlist?.items?.find(item => item.product_id === productId);
    
    if (!item) {
      toast.error("Item not found in wishlist");
      return;
    }

    try {
      setRemovingFromWishlist(wishlistId);
      
      const success = await removeFromWishlist({ wishlistId, itemId: item.id });
      
      if (success) {
        console.log('useWishlistPopoverLogic - Successfully removed from wishlist, reloading data');
        await loadWishlists();
        toast.success(`Removed from ${wishlistName}`);
        
        if (onClose) {
          onClose();
        }
        setOpen(false);
      }
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      toast.error("Failed to remove from wishlist");
    } finally {
      setRemovingFromWishlist(null);
      setShowRemoveConfirm(false);
      setWishlistToRemoveFrom(null);
    }
  };

  const handleRemoveFromAllWishlists = async () => {
    try {
      setRemovingFromWishlist('all');
      
      // Remove from all wishlists that contain this product
      const removalPromises = wishlistsContainingProduct.map(async (wishlist) => {
        const item = wishlist.items?.find(item => item.product_id === productId);
        if (item) {
          return removeFromWishlist({ wishlistId: wishlist.id, itemId: item.id });
        }
        return Promise.resolve(false);
      });
      
      const results = await Promise.all(removalPromises);
      const successCount = results.filter(Boolean).length;
      
      if (successCount > 0) {
        console.log('useWishlistPopoverLogic - Successfully removed from all wishlists, reloading data');
        await loadWishlists();
        toast.success(`Removed from ${successCount} wishlist${successCount > 1 ? 's' : ''}`);
        
        if (onClose) {
          onClose();
        }
        setOpen(false);
      } else {
        toast.error("Failed to remove from wishlists");
      }
    } catch (error) {
      console.error("Error removing from all wishlists:", error);
      toast.error("Failed to remove from wishlists");
    } finally {
      setRemovingFromWishlist(null);
      setShowRemoveAllConfirm(false);
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

  const confirmRemoveFromWishlist = (wishlistId: string, wishlistName: string) => {
    setWishlistToRemoveFrom({ id: wishlistId, name: wishlistName });
    setShowRemoveConfirm(true);
  };

  const confirmRemoveFromAllWishlists = () => {
    setShowRemoveAllConfirm(true);
  };

  return {
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
  };
};
