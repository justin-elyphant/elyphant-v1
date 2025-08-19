import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Gift } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Wishlist, WishlistItem, normalizeWishlist, normalizeWishlistItem } from "@/types/profile";

interface PublicWishlistsSectionProps {
  userId: string;
  connectionName: string;
}

export const PublicWishlistsSection = ({ userId, connectionName }: PublicWishlistsSectionProps) => {
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicWishlists = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch public wishlists for this user
        const { data: wishlistData, error: wishlistError } = await supabase
          .from('wishlists')
          .select('*')
          .eq('user_id', userId)
          .eq('is_public', true)
          .order('created_at', { ascending: false })
          .limit(3); // Show only top 3 for preview

        if (wishlistError) throw wishlistError;

        if (!wishlistData || wishlistData.length === 0) {
          setWishlists([]);
          setLoading(false);
          return;
        }

        // Fetch items for these wishlists (limit to 3 items per wishlist for preview)
        const wishlistIds = wishlistData.map(wl => wl.id);
        const { data: itemsData, error: itemsError } = await supabase
          .from('wishlist_items')
          .select('*')
          .in('wishlist_id', wishlistIds)
          .limit(9); // Max 3 items × 3 wishlists

        if (itemsError) throw itemsError;

        // Group items by wishlist and normalize
        const itemsByWishlist = (itemsData || []).reduce((acc, item) => {
          const normalized = normalizeWishlistItem(item);
          if (!acc[item.wishlist_id]) {
            acc[item.wishlist_id] = [];
          }
          if (acc[item.wishlist_id].length < 3) {
            acc[item.wishlist_id].push(normalized);
          }
          return acc;
        }, {} as Record<string, WishlistItem[]>);

        // Create normalized wishlists with their items
        const normalizedWishlists = wishlistData.map(wl => 
          normalizeWishlist({
            ...wl,
            items: itemsByWishlist[wl.id] || []
          })
        );

        setWishlists(normalizedWishlists);
      } catch (err) {
        console.error('Error fetching public wishlists:', err);
        setError('Failed to load wishlists');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchPublicWishlists();
    }
  }, [userId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-4 h-4" />
            <Skeleton className="h-5 w-32" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <div className="flex gap-2">
                  {[1, 2, 3].map(j => (
                    <Skeleton key={j} className="w-16 h-16 rounded" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || wishlists.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-4 h-4" />
            {connectionName}'s Wishlists
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Gift className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {error ? "Unable to load wishlists" : "No public wishlists shared"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-4 h-4" />
            {connectionName}'s Wishlists
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {wishlists.length} public
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {wishlists.map((wishlist) => (
            <div key={wishlist.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">{wishlist.title}</h4>
                <Button variant="ghost" size="sm" asChild>
                  <Link to={`/shared-wishlist/${wishlist.id}`}>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </Button>
              </div>
              
              {wishlist.items.length > 0 && (
                <div className="flex gap-2 overflow-x-auto">
                  {wishlist.items.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex-shrink-0">
                      <div className="w-16 h-16 bg-muted rounded overflow-hidden">
                        {item.image_url && (
                          <img 
                            src={item.image_url} 
                            alt={item.name || item.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <p className="text-xs text-center mt-1 truncate w-16">
                        {item.name || item.title}
                      </p>
                    </div>
                  ))}
                  {wishlist.items.length > 3 && (
                    <div className="flex-shrink-0 w-16 h-16 bg-muted rounded flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">
                        +{wishlist.items.length - 3}
                      </span>
                    </div>
                  )}
                </div>
              )}
              
              {wishlist.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {wishlist.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};