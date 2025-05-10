
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Heart, Calendar, Gift, Share2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Wishlist } from "@/types/profile";
import { useWishlist } from "../hooks/useWishlist";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";
import { Badge } from "@/components/ui/badge";
import GiftItemCard from "../GiftItemCard";
import ShareWishlistOptions from "./share/ShareWishlistOptions";

interface SharedWishlistViewProps {
  wishlist: Wishlist;
  owner: {
    name?: string;
    image?: string;
    id?: string;
  };
}

const SharedWishlistView = ({ wishlist, owner }: SharedWishlistViewProps) => {
  const { addToWishlist } = useWishlist();
  const { user } = useAuth();
  const [savingItemId, setSavingItemId] = useState<string | null>(null);
  const [showShareOptions, setShowShareOptions] = useState(false);

  const handleSaveItem = async (item: any) => {
    if (!user) {
      toast.error("You must be logged in to save items");
      return;
    }

    try {
      setSavingItemId(item.id);
      
      // Find user's first wishlist or show error
      const { wishlists } = useWishlist();
      if (!wishlists || wishlists.length === 0) {
        toast.error("You don't have any wishlists yet");
        return;
      }
      
      const targetWishlistId = wishlists[0].id;
      
      const savedItem = {
        product_id: item.product_id,
        name: item.name,
        price: item.price,
        image_url: item.image_url,
        brand: item.brand
      };
      
      const success = await addToWishlist(targetWishlistId, savedItem);
      
      if (success) {
        toast.success(`Saved "${item.name}" to your wishlist`);
      }
    } catch (error) {
      console.error("Error saving item:", error);
      toast.error("Failed to save item");
    } finally {
      setSavingItemId(null);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader className="sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button 
              asChild 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-foreground"
            >
              <Link to="/wishlists">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Wishlists
              </Link>
            </Button>
            
            <Badge variant="secondary" className="px-1.5 py-0">
              Shared Wishlist
            </Badge>
          </div>

          <CardTitle className="text-xl sm:text-2xl">{wishlist.title}</CardTitle>
          {wishlist.description && (
            <CardDescription className="mt-1">{wishlist.description}</CardDescription>
          )}
        </div>
        
        <div className="mt-4 sm:mt-0 flex flex-col sm:items-end gap-1">
          <div className="flex items-center gap-2">
            {owner.image ? (
              <img 
                src={owner.image} 
                alt={owner.name || "Owner"} 
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
                {(owner.name?.charAt(0) || "U").toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-medium">{owner.name || "Anonymous User"}</p>
              <p className="text-xs text-muted-foreground">Wishlist Owner</p>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2 ml-auto" 
            onClick={() => setShowShareOptions(!showShareOptions)}
          >
            <Share2 className="h-3.5 w-3.5 mr-1.5" />
            {showShareOptions ? "Hide sharing options" : "Share this wishlist"}
          </Button>
        </div>
      </CardHeader>
      
      {showShareOptions && (
        <div className="px-6 py-4 border-b">
          <ShareWishlistOptions wishlistId={wishlist.id} />
        </div>
      )}
      
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {wishlist.items.map((item) => (
            <div key={item.id} className="relative group">
              <GiftItemCard 
                name={item.name}
                price={item.price || 0}
                brand={item.brand || ""}
                imageUrl={item.image_url || "/placeholder.svg"}
              />
              <div className="absolute bottom-0 right-0 m-2">
                <Button 
                  size="sm" 
                  variant="secondary" 
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={savingItemId === item.id}
                  onClick={() => handleSaveItem(item)}
                >
                  <Heart className="h-3.5 w-3.5 mr-1.5" />
                  Save
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        {wishlist.items.length === 0 && (
          <div className="text-center py-12">
            <Gift className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium">This wishlist is empty</h3>
            <p className="text-muted-foreground">No items have been added yet</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="border-t flex flex-col gap-4 pt-4">
        <div className="text-sm flex flex-col sm:flex-row sm:justify-between gap-2 w-full">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Created {new Date(wishlist.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Gift className="h-4 w-4" />
            <span>{wishlist.items.length} {wishlist.items.length === 1 ? 'item' : 'items'} in wishlist</span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Button asChild variant="outline" className="w-full sm:flex-1">
            <Link to="/marketplace">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Browse Products
            </Link>
          </Button>
          
          <Button asChild className="w-full sm:flex-1">
            <Link to="/wishlists">
              <Gift className="h-4 w-4 mr-2" />
              My Wishlists
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default SharedWishlistView;
