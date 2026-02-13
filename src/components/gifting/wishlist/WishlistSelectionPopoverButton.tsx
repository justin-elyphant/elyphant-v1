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
    // Variant-specific fields for accurate SKU tracking
    selectedProductId?: string;  // Variant ASIN (overrides id)
    variationText?: string;      // "Color: Red, Size: Large"
  };
  triggerClassName?: string;
  variant?: "default" | "icon";
  onAdded?: (() => void) | null;
  isWishlisted?: boolean;
  showText?: boolean;
}

const WishlistSelectionPopoverButton: React.FC<WishlistSelectionPopoverButtonProps> = ({
  product,
  triggerClassName,
  variant = "default",
  onAdded,
  isWishlisted: isWishlistedProp,
  showText = false
}) => {
  const isMobile = useIsMobile();
  const { wishlists, addToWishlist } = useWishlist();
  const { wishlistedProducts } = useUnifiedWishlistSystem();
  const [open, setOpen] = React.useState(false);

  // Use prop if provided, otherwise check from hook (using includes for array)
  const isWishlisted = isWishlistedProp ?? wishlistedProducts.includes(product.id);

  const handleAddToWishlist = async (wishlistId: string) => {
    try {
      // Use variant ASIN if available, otherwise fall back to parent product ID
      const productIdToSave = product.selectedProductId || product.id;
      // Append variation text to name for clear wishlist display
      const displayName = product.variationText 
        ? `${product.name} (${product.variationText})` 
        : product.name;

      await addToWishlist(wishlistId, {
        name: displayName,
        title: displayName,
        price: product.price,
        image_url: product.image,
        brand: product.brand,
        product_id: productIdToSave,
      });
      toast.success(`Added to wishlist!`);
      setOpen(false);
      onAdded?.();
    } catch (error) {
      toast.error("Failed to add to wishlist");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size={variant === "icon" ? "icon" : "sm"}
          className={triggerClassName}
        >
          <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
          {(variant !== "icon" || showText) && <span className="ml-1">Save to Wishlist</span>}
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
