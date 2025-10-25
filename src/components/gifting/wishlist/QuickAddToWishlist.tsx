import React, { useState } from "react";
import { Plus, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useWishlist } from "../hooks/useWishlist";
import { Wishlist } from "@/types/profile";
import { toast } from "sonner";
import { Product } from "@/contexts/ProductContext";

interface QuickAddToWishlistProps {
  product: Product;
  wishlists: Wishlist[];
  onWishlistCreate?: () => void;
}

const QuickAddToWishlist: React.FC<QuickAddToWishlistProps> = ({
  product,
  wishlists,
  onWishlistCreate
}) => {
  const { addToWishlist, isProductWishlisted } = useWishlist();
  const [isAdding, setIsAdding] = useState(false);
  const [addedToWishlistId, setAddedToWishlistId] = useState<string | null>(null);

  // Check which wishlists contain this product
  const existingWishlists = wishlists.filter(w => 
    isProductWishlisted(product.product_id || product.id)
  );

  const handleAddToWishlist = async (wishlistId: string) => {
    try {
      setIsAdding(true);
      await addToWishlist(wishlistId, product);
      setAddedToWishlistId(wishlistId);
      
      const wishlist = wishlists.find(w => w.id === wishlistId);
      toast.success(`Added to ${wishlist?.title || "wishlist"}`);
      
      // Reset after 2 seconds
      setTimeout(() => {
        setAddedToWishlistId(null);
      }, 2000);
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      toast.error("Failed to add to wishlist");
    } finally {
      setIsAdding(false);
    }
  };

  // If already in a wishlist, show check icon
  if (existingWishlists.length > 0 && !addedToWishlistId) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        disabled
      >
        <Check className="h-4 w-4 text-green-600" />
        In {existingWishlists.length} {existingWishlists.length === 1 ? "Wishlist" : "Wishlists"}
      </Button>
    );
  }

  // If just added, show confirmation
  if (addedToWishlistId) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        disabled
      >
        <Check className="h-4 w-4 text-green-600" />
        Added!
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="default"
          size="sm"
          className="gap-2"
          disabled={isAdding || wishlists.length === 0}
        >
          <Plus className="h-4 w-4" />
          Add to Wishlist
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {wishlists.map((wishlist) => (
          <DropdownMenuItem
            key={wishlist.id}
            onClick={() => handleAddToWishlist(wishlist.id)}
          >
            {wishlist.title}
            <span className="ml-auto text-xs text-muted-foreground">
              {wishlist.items?.length || 0} items
            </span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onWishlistCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Wishlist
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default QuickAddToWishlist;
