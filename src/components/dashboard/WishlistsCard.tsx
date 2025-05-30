
import React from "react";
import { Link } from "react-router-dom";
import { Heart, Plus, ArrowRight, Gift, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useUnifiedWishlist } from "@/hooks/useUnifiedWishlist";
import { useAuth } from "@/contexts/auth";

const WishlistsCard = () => {
  const { wishlists, loading } = useUnifiedWishlist();
  const { user } = useAuth();

  // Don't show the card if user is not authenticated
  if (!user) {
    return null;
  }

  // Calculate total items across all wishlists
  const totalItems = wishlists?.reduce((total, wishlist) => total + (wishlist.items?.length || 0), 0) || 0;
  const wishlistCount = wishlists?.length || 0;

  // Get all items from all wishlists for the "All Saved" tab
  const allItems = wishlists?.flatMap(wishlist => 
    (wishlist.items || []).map(item => ({
      ...item,
      wishlistName: wishlist.title
    }))
  ) || [];

  const handleProductClick = (item: any) => {
    // Navigate to marketplace and potentially open product details
    // For now, we'll navigate to marketplace - could be enhanced to open specific product
    window.location.href = '/marketplace';
  };

  return (
    <Card className="border-2 border-pink-100 h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-semibold flex items-center">
              <Heart className="h-5 w-5 mr-2 text-pink-500" />
              My Wishlists
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              {wishlistCount > 0 
                ? `${wishlistCount} wishlist${wishlistCount > 1 ? 's' : ''} • ${totalItems} total items`
                : "Create wishlists to organize your favorite items"
              }
            </CardDescription>
          </div>
          <Link to="/wishlists" className="text-sm text-pink-600 hover:underline flex items-center whitespace-nowrap">
            Manage <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">Loading wishlists...</p>
          </div>
        ) : wishlistCount > 0 ? (
          <div className="space-y-4">
            <Tabs defaultValue="folders" className="w-full">
              <TabsList className="grid grid-cols-2 mb-3">
                <TabsTrigger value="folders" className="text-xs">
                  <Gift className="h-3 w-3 mr-1" /> Folders ({wishlistCount})
                </TabsTrigger>
                <TabsTrigger value="items" className="text-xs">
                  <Heart className="h-3 w-3 mr-1" /> All Saved ({totalItems})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="folders" className="space-y-2">
                {wishlists.slice(0, 3).map((wishlist) => (
                  <div key={wishlist.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium truncate">{wishlist.title}</h4>
                        {wishlist.category && (
                          <Badge variant="outline" className="text-xs">{wishlist.category}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {wishlist.items?.length || 0} item{(wishlist.items?.length || 0) !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <Link to={`/wishlist/${wishlist.id}`}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                ))}
                
                {wishlistCount > 3 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    +{wishlistCount - 3} more wishlist{wishlistCount - 3 !== 1 ? 's' : ''}
                  </p>
                )}
              </TabsContent>

              <TabsContent value="items" className="space-y-2">
                {totalItems > 0 ? (
                  <div className="space-y-2">
                    {allItems.slice(0, 4).map((item, index) => (
                      <div 
                        key={`${item.id}-${index}`} 
                        className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => handleProductClick(item)}
                      >
                        {item.image_url && (
                          <img 
                            src={item.image_url} 
                            alt={item.name || item.title} 
                            className="w-8 h-8 rounded object-cover flex-shrink-0"
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
                    
                    {totalItems > 4 && (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        +{totalItems - 4} more item{totalItems - 4 !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No items in your wishlists yet.</p>
                )}
              </TabsContent>
            </Tabs>
            
            <Button className="w-full" size="sm" asChild>
              <Link to="/wishlists">View All Wishlists</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center py-4">
              <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Start Your First Wishlist</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Create wishlists to organize items you'd love to receive or give as gifts.
              </p>
            </div>
            
            <div className="space-y-2">
              <Button className="w-full" asChild>
                <Link to="/wishlists">
                  <Plus className="h-4 w-4 mr-2" />
                  Create My First Wishlist
                </Link>
              </Button>
              
              <Button variant="outline" className="w-full" size="sm" asChild>
                <Link to="/marketplace">Browse & Add Items</Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WishlistsCard;
