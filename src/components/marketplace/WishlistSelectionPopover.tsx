
import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Heart, Plus } from "lucide-react";
import { WishlistData } from "@/components/gifting/wishlist/WishlistCard";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";
import { toast } from "sonner";

interface WishlistSelectionPopoverProps {
  productId: number;
  productName: string;
  trigger: React.ReactNode;
}

export const WishlistSelectionPopover = ({ 
  productId, 
  productName,
  trigger 
}: WishlistSelectionPopoverProps) => {
  const [wishlists, setWishlists] = useLocalStorage<WishlistData[]>("userWishlists", []);
  const [open, setOpen] = React.useState(false);

  const handleAddToWishlist = (wishlistId: number) => {
    setWishlists(prev => {
      return prev.map(wishlist => {
        if (wishlist.id === wishlistId) {
          // Check if item is already in the wishlist
          const itemExists = wishlist.items.some(item => item.id === productId);
          
          if (itemExists) {
            toast.info(`"${productName}" is already in this wishlist`);
            return wishlist;
          }
          
          // Add item to wishlist
          const newItems = [
            ...wishlist.items,
            {
              id: productId,
              name: productName,
              price: 99.99, // This would ideally come from the product
              brand: "Brand", // This would ideally come from the product
              imageUrl: "/placeholder.svg" // This would ideally come from the product
            }
          ];
          
          toast.success(`Added "${productName}" to ${wishlist.title}`);
          
          return {
            ...wishlist,
            items: newItems
          };
        }
        return wishlist;
      });
    });
    
    setOpen(false);
  };

  if (wishlists.length === 0) {
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
            <Button asChild className="mt-2 w-full">
              <a href="/wishlists">
                <Plus className="mr-2 h-4 w-4" />
                Create Wishlist
              </a>
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
        <div className="max-h-72 overflow-auto">
          {wishlists.map(wishlist => (
            <div 
              key={wishlist.id} 
              className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0 flex justify-between"
              onClick={() => handleAddToWishlist(wishlist.id)}
            >
              <div>
                <p className="font-medium">{wishlist.title}</p>
                <p className="text-xs text-muted-foreground">
                  {wishlist.items.length} {wishlist.items.length === 1 ? 'item' : 'items'}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <div className="p-3 border-t">
          <Button asChild variant="outline" size="sm" className="w-full">
            <a href="/wishlists">
              <Plus className="mr-2 h-4 w-4" />
              Create New Wishlist
            </a>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default WishlistSelectionPopover;
