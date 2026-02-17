
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [laterItems, setLaterItems] = useState<any[]>([]);
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    
    const fetchFavorites = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('gift_preferences, wishlists')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        // Process gift preferences (for backward compatibility)
        if (profile.gift_preferences && Array.isArray(profile.gift_preferences)) {
          const favIds = profile.gift_preferences
            .filter((pref: any) => 
              typeof pref === 'object' && pref.importance === "high"
            )
            .map((pref: any) => 
              typeof pref === 'object' ? pref.category : pref
            );
          
          setFavorites(favIds || []);
        }
        
        // Process wishlists
        if (profile.wishlists && Array.isArray(profile.wishlists)) {
          let wishlistProducts: any[] = [];
          
          profile.wishlists.forEach((list: any) => {
            if (list && Array.isArray(list.items)) {
              list.items.forEach((item: any) => {
                if (item.name && item.price) {
                  wishlistProducts.push({
                    name: item.name,
                    price: typeof item.price === 'number' ? formatPrice(item.price) : item.price
                  });
                }
              });
            }
          });
          
          setWishlistItems(wishlistProducts.slice(0, 3));
          
          // Mock later items for now - can be expanded in the future
          setLaterItems([
            { name: "Fitness Tracker", price: "$79.99" },
            { name: "Summer Hat", price: "$24.99" },
          ]);
        }
      }
    };
    
    fetchFavorites();
  }, [user]);

  // Add the missing methods
  const handleFavoriteToggle = useCallback((productId: string) => {
    if (!productId) return;
    
    setFavorites(prev => {
      // Check if the product is already favorited
      const isFavorite = prev.includes(productId);
      
      // Toggle the favorite status
      const newFavorites = isFavorite 
        ? prev.filter(id => id !== productId) 
        : [...prev, productId];
      
      // Show toast notification
      if (isFavorite) {
        toast.info("Removed from favorites");
      } else {
        toast.success("Added to favorites");
      }
      
      return newFavorites;
    });
  }, []);
  
  // Function to check if an item is favorited
  const isFavorited = useCallback((productId: string) => {
    return favorites.includes(productId);
  }, [favorites]);

  return { favorites, laterItems, wishlistItems, handleFavoriteToggle, isFavorited };
}
