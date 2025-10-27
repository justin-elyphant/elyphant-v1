
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, ShoppingBag, Trash2, Loader2, Eye, Share2 } from "lucide-react";
import EnhancedWishlistCard from "./EnhancedWishlistCard";
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
  const navigate = useNavigate();
  
  const handleRemoveItem = async (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when removing item
    
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

  const handleCardClick = () => {
    navigate(`/wishlist/${wishlist.id}`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(wishlist.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(wishlist.id);
  };

  const handleStartShopping = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Navigate to workspace to use shopping panel
    navigate(`/wishlist/${wishlist.id}?openShopping=true`);
  };

  const handleAddMoreItems = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Navigate to workspace to use shopping panel
    navigate(`/wishlist/${wishlist.id}?openShopping=true`);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/shared-wishlist/${wishlist.id}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Wishlist link copied!", {
        description: "Share this link with friends and family"
      });
    } catch (err) {
      console.error("Failed to copy link:", err);
      toast.error("Failed to copy link");
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
    <Card 
      key={wishlist.id} 
      className="relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleCardClick}
    >
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
        className="absolute top-2 right-2 h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 z-10"
        onClick={handleDelete}
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
            <EnhancedWishlistCard
              key={item.id}
              item={item}
              onRemove={() => handleRemoveItem(item.id, { stopPropagation: () => {} } as React.MouseEvent)}
              isRemoving={removingItemId === item.id}
              className="min-h-[100px]"
            />
          ))}
        </div>
        {wishlist.items.length > 4 && (
          <div className="mt-2 text-center">
            <button 
              className="text-sm text-primary hover:text-primary/80 font-medium"
              onClick={handleCardClick}
            >
              +{wishlist.items.length - 4} more items
            </button>
          </div>
        )}
        
        {wishlist.items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-muted-foreground text-center mb-4">
              This wishlist is empty. Start adding items!
            </p>
            <Button 
              variant="default" 
              className="w-full bg-purple-600 hover:bg-purple-700"
              onClick={handleStartShopping}
            >
              <ShoppingBag className="mr-2 h-4 w-4" />
              Start Shopping
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col space-y-3">
        <div className="flex w-full justify-between gap-2">
          <Button variant="outline" size="sm" onClick={handleEdit}>
            <Edit className="mr-2 h-3 w-3" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={handleCardClick}>
            <Eye className="mr-2 h-3 w-3" />
            View All
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            onClick={handleShare}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            <Share2 className="mr-2 h-3 w-3" />
            Share
          </Button>
        </div>
        
        {wishlist.items.length > 0 && (
          <Button 
            variant="default" 
            size="sm" 
            className="w-full bg-purple-600 hover:bg-purple-700"
            onClick={handleAddMoreItems}
          >
            <ShoppingBag className="mr-2 h-3 w-3" />
            Add More Items
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default WishlistCard;
