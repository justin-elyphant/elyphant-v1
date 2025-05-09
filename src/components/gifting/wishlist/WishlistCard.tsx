
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Share2, ShoppingBag, Trash2, Loader2, Globe, Lock } from "lucide-react";
import GiftItemCard from "../GiftItemCard";
import { toast } from "sonner";
import { Wishlist, WishlistItem } from "@/types/profile";
import { useWishlist } from "../hooks/useWishlist";
import ShareWishlistDialog from "./ShareWishlistDialog";
import { Badge } from "@/components/ui/badge";

interface WishlistCardProps {
  wishlist: Wishlist;
  onEdit: (id: string) => void;
  onShare: (id: string) => void;
  onDelete: (id: string) => void;
}

const WishlistCard = ({ wishlist, onEdit, onShare, onDelete }: WishlistCardProps) => {
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
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

  const handleOpenShareDialog = () => {
    setShareDialogOpen(true);
  };

  return (
    <Card key={wishlist.id} className="relative">
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-2 right-2 h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
        onClick={() => onDelete(wishlist.id)}
        aria-label={`Delete ${wishlist.title} wishlist`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      
      <CardHeader>
        <div className="flex items-center justify-between pr-8">
          <CardTitle>{wishlist.title}</CardTitle>
          {wishlist.is_public ? (
            <Badge variant="outline" className="flex gap-1 items-center text-green-600 border-green-200 bg-green-50">
              <Globe className="h-3 w-3" />
              Public
            </Badge>
          ) : (
            <Badge variant="outline" className="flex gap-1 items-center">
              <Lock className="h-3 w-3" />
              Private
            </Badge>
          )}
        </div>
        <CardDescription>{wishlist.description}</CardDescription>
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
        <div className="flex w-full justify-between">
          <Button variant="outline" size="sm" onClick={() => onEdit(wishlist.id)}>
            <Edit className="mr-2 h-3 w-3" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={handleOpenShareDialog}>
            <Share2 className="mr-2 h-3 w-3" />
            Share
          </Button>
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

      <ShareWishlistDialog 
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        wishlist={wishlist}
        onShareSettingsChange={updateWishlistSharing}
      />
    </Card>
  );
};

export default WishlistCard;
