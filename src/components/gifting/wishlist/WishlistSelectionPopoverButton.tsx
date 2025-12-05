import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUnifiedWishlistSystem } from "@/hooks/useUnifiedWishlistSystem";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useWishlist } from "@/components/gifting/hooks/useWishlist";
import { toast } from "sonner";

interface WishlistSelectionPopoverButtonProps {
  product: {
    id: string;
    name: string;
    price?: number;
    image?: string;
    brand?: string;
  };
  triggerClassName?: string;
  variant?: "default" | "icon";
}

const WishlistSelectionPopoverButton: React.FC<WishlistSelectionPopoverButtonProps> = ({
  product,
  triggerClassName,
  variant = "default"
}) => {
  const isMobile = useIsMobile();
  const { wishlists, addToWishlist } = useWishlist();
  const { wishlistedProducts } = useUnifiedWishlistSystem();
  const [open, setOpen] = React.useState(false);

  const isWishlisted = wishlistedProducts.has(product.id);

  const handleAddToWishlist = async (wishlistId: string) => {
    try {
      await addToWishlist(wishlistId, {
        name: product.name,
        title: product.name,
        price: product.price,
        image_url: product.image,
        brand: product.brand,
        product_id: product.id,
      });
      toast.success(`Added to wishlist!`);
      setOpen(false);
    } catch (error) {
      toast.error("Failed to add to wishlist");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size={variant === "icon" ? "icon" : "sm"}
          className={triggerClassName}
        >
          <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
          {variant !== "icon" && <span className="ml-1">Save</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="end">
        <div className="space-y-1">
          <p className="text-sm font-medium mb-2">Add to wishlist</p>
          {wishlists.map((wishlist) => (
            <Button
              key={wishlist.id}
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sm"
              onClick={() => handleAddToWishlist(wishlist.id)}
            >
              {wishlist.title}
            </Button>
          ))}
          {wishlists.length === 0 && (
            <p className="text-sm text-muted-foreground">No wishlists yet</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default WishlistSelectionPopoverButton;
