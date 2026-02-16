import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Heart, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUnifiedWishlistSystem } from "@/hooks/useUnifiedWishlistSystem";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useWishlist } from "@/components/gifting/hooks/useWishlist";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

// ... keep existing code (interface)
interface WishlistSelectionPopoverButtonProps {
  product: {
    id: string;
    name: string;
    price?: number;
    image?: string;
    brand?: string;
    selectedProductId?: string;
    variationText?: string;
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
  const { wishlists, addToWishlist, createWishlist } = useWishlist();
  const { wishlistedProducts } = useUnifiedWishlistSystem();
  const [open, setOpen] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);
  const [newWishlistName, setNewWishlistName] = React.useState("");

  const isWishlisted = isWishlistedProp ?? wishlistedProducts.includes(product.id);

  const handleAddToWishlist = async (wishlistId: string) => {
    try {
      const productIdToSave = product.selectedProductId || product.id;
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

  const handleCreateAndAdd = async () => {
    const name = newWishlistName.trim();
    if (!name) return;
    try {
      const newWishlist = await createWishlist(name);
      if (newWishlist?.id) {
        setNewWishlistName("");
        setIsCreating(false);
        await handleAddToWishlist(newWishlist.id);
      }
    } catch (error) {
      toast.error("Failed to create wishlist");
    }
  };

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setIsCreating(false); }} modal={false}>
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
      <PopoverContent className="w-52 p-2" align="end">
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
          {isCreating ? (
            <div className="flex gap-1 mt-1">
              <Input
                autoFocus
                placeholder="Wishlist name"
                value={newWishlistName}
                onChange={(e) => setNewWishlistName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreateAndAdd(); }}
                className="h-8 text-sm"
              />
              <Button size="sm" className="h-8 px-2 shrink-0" onClick={handleCreateAndAdd}>
                Add
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sm text-muted-foreground"
              onClick={() => setIsCreating(true)}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              New Wishlist
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default WishlistSelectionPopoverButton;
