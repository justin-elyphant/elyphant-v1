import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Gift, Heart, Lock, ShoppingBag, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import GiftItemCard from "@/components/gifting/GiftItemCard";
import { supabase } from "@/integrations/supabase/client";
import { Wishlist } from "@/types/profile";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";
import { useWishlist } from "@/components/gifting/hooks/useWishlist";
import { useProfile } from "@/contexts/profile/ProfileContext";

const SharedWishlist = () => {
  const { wishlistId } = useParams();
  const { user } = useAuth();
  const { addToWishlist } = useWishlist();
  const { profile } = useProfile();
  
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [ownerProfile, setOwnerProfile] = useState<any | null>(null);
  const [savingItemId, setSavingItemId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSharedWishlist = async () => {
      if (!wishlistId) return;

      try {
        setLoading(true);
        
        // For demo purposes, we'll fetch from the local user's wishlists
        // In a real implementation, this would be a separate API endpoint
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('wishlists, name, profile_image')
          .eq('id', user?.id)
          .single();
        
        if (profileError) {
          console.error("Error fetching profile:", profileError);
          toast.error("Failed to load wishlist");
          return;
        }
        
        // Find the specific wishlist
        if (profileData?.wishlists && Array.isArray(profileData.wishlists)) {
          const foundWishlist = profileData.wishlists.find(list => list.id === wishlistId);
          if (foundWishlist) {
            setWishlist(foundWishlist);
            setOwnerProfile({
              name: profileData.name,
              image: profileData.profile_image
            });
          } else {
            toast.error("Wishlist not found or is private");
          }
        }
      } catch (error) {
        console.error("Error fetching shared wishlist:", error);
        toast.error("Failed to load wishlist");
      } finally {
        setLoading(false);
      }
    };

    fetchSharedWishlist();
  }, [wishlistId, user?.id]);

  const handleSaveItem = async (item: any) => {
    if (!user) {
      toast.error("You must be logged in to save items");
      return;
    }

    try {
      setSavingItemId(item.id);
      
      // Find user's first wishlist or create one
      let targetWishlistId = "";
      
      if (profile && profile.wishlists && profile.wishlists.length > 0) {
        targetWishlistId = profile.wishlists[0].id;
      } else {
        toast.error("You don't have any wishlists yet");
        return;
      }
      
      const savedItem = {
        name: item.name,
        product_id: item.product_id,
        price: item.price,
        image_url: item.image_url,
        brand: item.brand,
        notes: `Saved from ${ownerProfile?.name}'s wishlist`
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

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!wishlist || !wishlist.is_public) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="text-center py-12">
          <CardContent className="space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <Lock className="h-6 w-6 text-gray-500" />
            </div>
            <h2 className="text-xl font-bold">This wishlist is private</h2>
            <p className="text-muted-foreground">
              This wishlist is either private or has been removed.
            </p>
            <Button asChild className="mt-4">
              <Link to="/">Go Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            {ownerProfile?.image ? (
              <img 
                src={ownerProfile.image} 
                alt={ownerProfile.name} 
                className="w-12 h-12 rounded-full object-cover" 
              />
            ) : (
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
            )}
            <div>
              <CardTitle className="text-xl">{wishlist.title}</CardTitle>
              <CardDescription>
                {ownerProfile?.name}'s wishlist · {wishlist.items.length} items
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {wishlist.description && (
            <p className="text-muted-foreground mb-6">{wishlist.description}</p>
          )}
          
          {wishlist.items.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {wishlist.items.map((item) => (
                <div key={item.id} className="relative group">
                  <GiftItemCard
                    name={item.name}
                    price={item.price || 0}
                    brand={item.brand || ""}
                    imageUrl={item.image_url || "/placeholder.svg"}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleSaveItem(item)}
                    disabled={savingItemId === item.id}
                  >
                    {savingItemId === item.id ? (
                      <Clock className="h-4 w-4 animate-spin" />
                    ) : (
                      <Heart className="h-4 w-4 mr-1" />
                    )}
                    {savingItemId === item.id ? "Saving..." : "Save"}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Gift className="h-12 w-12 mx-auto text-gray-300 mb-2" />
              <p className="text-muted-foreground">This wishlist is empty.</p>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Want to create your own wishlist? Sign up or log in to get started.
          </p>
          <div className="flex gap-4">
            <Button asChild variant="outline">
              <Link to="/marketplace">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Browse Products
              </Link>
            </Button>
            <Button asChild>
              <Link to="/wishlists">
                <Gift className="h-4 w-4 mr-2" />
                My Wishlists
              </Link>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SharedWishlist;
