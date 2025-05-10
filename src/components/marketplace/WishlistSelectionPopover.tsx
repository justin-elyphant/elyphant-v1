
import React, { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Heart, Plus, Loader2, RefreshCw, AlertTriangle, Check } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";
import { useWishlist } from "@/components/gifting/hooks/useWishlist";

interface WishlistSelectionPopoverProps {
  productId: string;
  productName: string;
  productImage?: string;
  productPrice?: number;
  productBrand?: string;
  trigger: React.ReactNode;
}

export const WishlistSelectionPopover = ({ 
  productId, 
  productName,
  productImage,
  productPrice,
  productBrand,
  trigger 
}: WishlistSelectionPopoverProps) => {
  const { user } = useAuth();
  const { 
    wishlists, 
    createWishlist, 
    addToWishlist, 
    isLoading, 
    initError,
    reloadWishlists 
  } = useWishlist();
  
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [quickCreationName, setQuickCreationName] = useState("");
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  
  // Reset states if popover closes
  useEffect(() => {
    if (!open) {
      setAdding(null);
      setShowQuickCreate(false);
      setQuickCreationName("");
    }
  }, [open]);
  
  const handleAddToWishlist = async (wishlistId: string) => {
    try {
      setAdding(wishlistId);
      
      // Format item data
      const itemData = {
        name: productName,
        product_id: productId,
        price: productPrice,
        image_url: productImage,
        brand: productBrand,
        notes: ""
      };
      
      // Add to wishlist
      const success = await addToWishlist(wishlistId, itemData);
      
      if (success) {
        toast.success(`Added "${productName}" to wishlist`, {
          description: "You can view your wishlists anytime",
          action: {
            label: "View Wishlist",
            onClick: () => window.location.href = "/wishlists"
          }
        });
        setOpen(false);
      }
    } catch (error) {
      console.error("Error adding item to wishlist:", error);
      toast.error("Failed to add item to wishlist");
    } finally {
      setAdding(null);
    }
  };
  
  const handleQuickCreate = async () => {
    if (!quickCreationName.trim()) {
      setQuickCreationName("My Wishlist");
    }
    
    try {
      setCreating(true);
      const name = quickCreationName.trim() || "My Wishlist";
      const newWishlist = await createWishlist(name, `Items I'd like to receive`);
      
      if (newWishlist) {
        // Add item to the new wishlist
        await handleAddToWishlist(newWishlist.id);
        setShowQuickCreate(false);
      }
    } catch (error) {
      console.error("Error creating wishlist:", error);
      toast.error("Failed to create wishlist");
    } finally {
      setCreating(false);
    }
  };
  
  const handleCreateQuickWishlist = () => {
    setShowQuickCreate(true);
  };
  
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await reloadWishlists();
      toast.success("Wishlists refreshed");
    } catch (error) {
      console.error("Error refreshing wishlists:", error);
      toast.error("Failed to refresh wishlists");
    } finally {
      setRefreshing(false);
    }
  };
  
  // Ensure user is authenticated
  if (!user) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {trigger}
        </PopoverTrigger>
        <PopoverContent className="w-72 p-4">
          <div className="text-center space-y-3">
            <p className="font-medium">Sign in to save items to your wishlist</p>
            <p className="text-sm text-muted-foreground">
              Create an account or sign in to save items
            </p>
            <Button asChild className="mt-2 w-full">
              <a href="/login">
                Sign In
              </a>
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }
  
  // Show loading state
  if (isLoading) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {trigger}
        </PopoverTrigger>
        <PopoverContent className="w-72 p-4">
          <div className="flex flex-col items-center justify-center py-4">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
            <p className="text-sm text-muted-foreground">Loading your wishlists...</p>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // Show error state with retry
  if (initError) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {trigger}
        </PopoverTrigger>
        <PopoverContent className="w-72 p-4">
          <div className="text-center space-y-3">
            <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto" />
            <p className="font-medium">Failed to load wishlists</p>
            <p className="text-sm text-muted-foreground">
              We couldn't load your wishlists. Please try again.
            </p>
            <Button 
              onClick={handleRefresh} 
              className="mt-2 w-full"
              variant="outline"
              disabled={refreshing}
            >
              {refreshing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </>
              )}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }
  
  if (!wishlists || wishlists.length === 0) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {trigger}
        </PopoverTrigger>
        <PopoverContent className="w-72 p-4">
          <div className="text-center space-y-3">
            <p className="font-medium">You don't have any wishlists yet</p>
            <p className="text-sm text-muted-foreground">
              Create a wishlist to save items you love
            </p>
            <Button 
              onClick={handleQuickCreate} 
              className="mt-2 w-full"
              disabled={creating}
            >
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Wishlist
                </>
              )}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="p-4 border-b">
          <h4 className="font-medium">Add to Wishlist</h4>
          <p className="text-sm text-muted-foreground">Select which wishlist to add this item to</p>
        </div>
        
        {showQuickCreate ? (
          <div className="p-4 border-b">
            <div className="space-y-3">
              <div className="space-y-1">
                <label htmlFor="wishlist-name" className="text-sm font-medium">
                  Wishlist Name
                </label>
                <div className="flex gap-2">
                  <input 
                    id="wishlist-name"
                    type="text"
                    placeholder="My Wishlist" 
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={quickCreationName}
                    onChange={(e) => setQuickCreationName(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowQuickCreate(false)}
                  disabled={creating}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={handleQuickCreate}
                  disabled={creating}
                >
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Create & Add
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-h-72 overflow-auto">
            {wishlists.map(wishlist => (
              <div 
                key={wishlist.id} 
                className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0 flex justify-between items-center"
                onClick={() => handleAddToWishlist(wishlist.id)}
              >
                <div>
                  <p className="font-medium">{wishlist.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {wishlist.items.length} {wishlist.items.length === 1 ? 'item' : 'items'}
                  </p>
                </div>
                {adding === wishlist.id ? (
                  <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </Button>
                ) : (
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
        
        <div className="p-3 border-t">
          {!showQuickCreate && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-1/2"
                onClick={handleCreateQuickWishlist}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Wishlist
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                className="w-1/2"
                onClick={() => {
                  setOpen(false);
                  // Navigate to wishlists page
                  window.location.href = "/wishlists"; 
                }}
              >
                Manage All
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default WishlistSelectionPopover;
