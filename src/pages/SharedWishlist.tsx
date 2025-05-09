
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Wishlist } from "@/types/profile";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";
import { useWishlist } from "@/components/gifting/hooks/useWishlist";
import { useProfile } from "@/contexts/profile/ProfileContext";
import SharedWishlistSkeleton from "@/components/gifting/wishlist/SharedWishlistSkeleton";
import NoWishlistFound from "@/components/gifting/wishlist/NoWishlistFound";
import WishlistItemsGrid from "@/components/gifting/wishlist/WishlistItemsGrid";
import WishlistOwnerInfo from "@/components/gifting/wishlist/WishlistOwnerInfo";

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
        <SharedWishlistSkeleton />
      </div>
    );
  }

  if (!wishlist || !wishlist.is_public) {
    return (
      <div className="container mx-auto py-8 px-4">
        <NoWishlistFound />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <WishlistOwnerInfo wishlist={wishlist} ownerProfile={ownerProfile} />
        </CardHeader>
        
        <CardContent>
          {wishlist.description && (
            <p className="text-muted-foreground mb-6">{wishlist.description}</p>
          )}
          
          <WishlistItemsGrid 
            items={wishlist.items} 
            onSaveItem={handleSaveItem} 
            savingItemId={savingItemId} 
          />
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
