
import React from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Share2, ShoppingBag, Trash2 } from "lucide-react";
import GiftItemCard from "../GiftItemCard";
import { toast } from "sonner";

export interface WishlistItem {
  id: number;
  name: string;
  price: number;
  brand: string;
  imageUrl: string;
}

export interface WishlistData {
  id: number;
  title: string;
  description: string;
  items: WishlistItem[];
}

interface WishlistCardProps {
  wishlist: WishlistData;
  onEdit: (id: number) => void;
  onShare: (id: number) => void;
  onDelete: (id: number) => void;
}

const WishlistCard = ({ wishlist, onEdit, onShare, onDelete }: WishlistCardProps) => {
  const handleRemoveItem = (itemId: number) => {
    // Create an updated copy of the wishlist with the item removed
    const updatedWishlist = {
      ...wishlist,
      items: wishlist.items.filter(item => item.id !== itemId)
    };
    
    // Update the wishlist in localStorage
    const storedWishlists = JSON.parse(localStorage.getItem("userWishlists") || "[]");
    const updatedWishlists = storedWishlists.map((wl: WishlistData) => 
      wl.id === wishlist.id ? updatedWishlist : wl
    );
    
    localStorage.setItem("userWishlists", JSON.stringify(updatedWishlists));
    
    // Force a reload to update the UI
    window.location.reload();
    
    // Show toast notification
    toast.success("Item removed from wishlist");
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
        <CardTitle>{wishlist.title}</CardTitle>
        <CardDescription>{wishlist.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {wishlist.items.slice(0, 4).map((item) => (
            <div key={item.id} className="relative group">
              <GiftItemCard 
                name={item.name}
                price={item.price}
                brand={item.brand}
                imageUrl={item.imageUrl}
                mini
              />
              <button
                onClick={() => handleRemoveItem(item.id)}
                className="absolute top-1 right-1 bg-white/80 hover:bg-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={`Remove ${item.name} from wishlist`}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </button>
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
          <Button variant="outline" size="sm" onClick={() => onShare(wishlist.id)}>
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
    </Card>
  );
};

export default WishlistCard;
