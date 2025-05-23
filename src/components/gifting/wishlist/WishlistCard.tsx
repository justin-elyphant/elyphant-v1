import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, ShoppingBag, Trash2, Loader2 } from "lucide-react";
import GiftItemCard from "../GiftItemCard";
import { toast } from "sonner";
import { Wishlist, WishlistItem } from "@/types/profile";
import { useWishlist } from "../hooks/useWishlist";
import WishlistShareButton from "./share/WishlistShareButton";
import ShareStatusBadge from "./ShareStatusBadge";
import WishlistCategoryBadge from "./categories/WishlistCategoryBadge";
import WishlistSelectionPopoverButton from "./WishlistSelectionPopoverButton";

interface WishlistCardProps {
  wishlist: Wishlist;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const WishlistCard = ({ wishlist, onEdit, onDelete }: WishlistCardProps) => {
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  const { removeFromWishlist, updateWishlistSharing } = useWishlist();
  
  const handleRemoveItem = async (itemId: string) => {
    try {
      setRemovingItemId(itemId);
      const success = await removeFromWishlist(wishlist.id, itemId);
      
      if (success) {
        toast.success("Item removed from wishlist");
      }
    } catch (error) {
      console.error("Error removing item from wishlist:", error);
      toast.error("Failed to remove item from wishlist");
    } finally {
      setRemovingItemId(null);
    }
  };

  // Determine badge styles based on priority
  const getPriorityBadge = () => {
    if (!wishlist.priority) return null;

    const styles = {
      high: "bg-red-50 text-red-700 border-red-200",
      medium: "bg-amber-50 text-amber-700 border-amber-200",
      low: "bg-blue-50 text-blue-700 border-blue-200"
    };

    return (
      <div className="flex items-center gap-1 text-xs">
        <div className={`w-2 h-2 rounded-full ${wishlist.priority === 'high' ? 'bg-red-500' : 
          wishlist.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
        <span className="capitalize">{wishlist.priority} priority</span>
      </div>
    );
  };

  return (
    <Card key={wishlist.id} className="relative overflow-hidden">
      {/* Privacy status indicator at top corner */}
      <div className="absolute top-0 right-0">
        <ShareStatusBadge 
          isPublic={wishlist.is_public} 
          showText={false}
          size="sm"
          className="rounded-none rounded-bl-lg"
        />
      </div>
      
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-2 right-2 h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
        onClick={() => onDelete(wishlist.id)}
        aria-label={`Delete ${wishlist.title} wishlist`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      
      <CardHeader className="pb-2 flex items-center justify-between">
        <div>
          <CardTitle>{wishlist.title}</CardTitle>
          {wishlist.description && (
            <CardDescription>{wishlist.description}</CardDescription>
          )}
          
          <div className="flex flex-wrap gap-2 mt-2">
            {wishlist.category && (
              <WishlistCategoryBadge category={wishlist.category} />
            )}
            
            {getPriorityBadge()}

            {wishlist.tags?.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs bg-gray-50">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        {/* Add-to-wishlist popover: encourage new item addition */}
        <WishlistSelectionPopoverButton
          product={{
            id: "",
            name: "",
          }}
          triggerClassName="ml-2"
          onAdded={null}
        />
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {wishlist.items.slice(0, 4).map((item) => (
            <div key={item.id} className="relative group">
              <GiftItemCard 
                name={item.name}
                price={item.price || 0}
                brand={item.brand || ""}
                imageUrl={item.image_url || "/placeholder.svg"}
                mini
              />
              {removingItemId === item.id ? (
                <div className="absolute top-1 right-1 bg-white/80 rounded-full p-1">
                  <Loader2 className="h-4 w-4 text-primary animate-spin" />
                </div>
              ) : (
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="absolute top-1 right-1 bg-white/80 hover:bg-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Remove ${item.name} from wishlist`}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
              )}
            </div>
          ))}
        </div>
        {wishlist.items.length > 4 && (
          <p className="text-sm text-gray-500 mt-2">
            +{wishlist.items.length - 4} more items
          </p>
        )}
        
        {wishlist.items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-muted-foreground text-center mb-4">
              This wishlist is empty. Start adding items!
            </p>
            <Button asChild variant="default" className="w-full bg-purple-600 hover:bg-purple-700">
              <Link to="/marketplace">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Start Shopping
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col space-y-3">
        <div className="flex w-full justify-between gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(wishlist.id)}>
            <Edit className="mr-2 h-3 w-3" />
            Edit
          </Button>
          <WishlistShareButton 
            wishlist={wishlist}
            size="sm"
            onShareSettingsChange={updateWishlistSharing}
            className="flex-1"
          />
        </div>
        
        {wishlist.items.length > 0 && (
          <Button asChild variant="default" size="sm" className="w-full bg-purple-600 hover:bg-purple-700">
            <Link to="/marketplace">
              <ShoppingBag className="mr-2 h-3 w-3" />
              Add More Items
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default WishlistCard;
