import React from "react";
import { Link } from "react-router-dom";
import { Heart, Package, ShoppingCart, Eye, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUnifiedWishlist } from "@/hooks/useUnifiedWishlist";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const QuickShopCard = () => {
  const isMobile = useIsMobile();
  const { wishlists, loading } = useUnifiedWishlist();

  const totalItems = React.useMemo(() => {
    return wishlists?.reduce((total, wishlist) => total + (wishlist.items?.length || 0), 0) || 0;
  }, [wishlists]);

  const recentItems = React.useMemo(() => {
    const allItems = wishlists?.flatMap(wishlist => 
      (wishlist.items || []).map(item => ({
        ...item,
        wishlistName: wishlist.title,
        addedDate: item.created_at ? new Date(item.created_at) : new Date()
      }))
    ) || [];
    
    return allItems.slice(0, 3);
  }, [wishlists]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Heart className="h-5 w-5 text-pink-500" />
          My Wishlists
          {totalItems > 0 && (
            <Badge variant="secondary">{totalItems} items</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded animate-pulse" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : totalItems > 0 ? (
          <>
            {/* Recent Items Preview */}
            <div className="space-y-3">
              {recentItems.map((item, index) => (
                <div key={`${item.id}-${index}`} className="flex items-center gap-3">
                  {item.image_url && (
                    <img 
                      src={item.image_url} 
                      alt={item.name || item.title} 
                      className="w-10 h-10 rounded object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name || item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.wishlistName}</p>
                  </div>
                  {item.price && (
                    <p className="text-sm font-medium">${item.price}</p>
                  )}
                </div>
              ))}
              {totalItems > 3 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{totalItems - 3} more items
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className={cn(
              "grid gap-2",
              isMobile ? "grid-cols-1" : "grid-cols-2"
            )}>
              <Button variant="outline" size="sm" asChild>
                <Link to="/wishlists" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  View All
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/marketplace" className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Add Items
                </Link>
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <Package className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50" />
            <h4 className="font-medium mb-2">No wishlists yet</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first wishlist to organize gift ideas
            </p>
            <Button asChild>
              <Link to="/marketplace" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Browse & Add Items
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuickShopCard;