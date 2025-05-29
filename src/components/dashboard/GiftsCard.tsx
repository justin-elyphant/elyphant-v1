
import React from "react";
import { Link } from "react-router-dom";
import { Heart, Clock, Plus, ArrowRight, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFavorites } from "@/components/gifting/hooks/useFavorites";
import { useAuth } from "@/contexts/auth";

const GiftsCard = () => {
  const { laterItems, wishlistItems } = useFavorites();
  const { user } = useAuth();

  // Use counts from fetched data, never fallback to mock values
  const wishlistCount = wishlistItems ? wishlistItems.length : 0;
  const laterCount = laterItems ? laterItems.length : 0;

  // Mock data for the wishlist items (for UI preview only, not for counts)
  const mockWishlistItems = [
    { name: "Leather Wallet", price: "$45.99" },
    { name: "Smart Watch", price: "$199.99" },
    { name: "Wireless Headphones", price: "$89.99" },
  ];

  // Mock data for later items
  const mockLaterItems = [
    { name: "Fitness Tracker", price: "$79.99" },
    { name: "Summer Hat", price: "$24.99" },
  ];

  // Don't show the card if user is not authenticated
  if (!user) {
    return null;
  }

  return (
    <Card className="border-2 border-pink-100 h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-semibold flex items-center">
              <Heart className="h-5 w-5 mr-2 text-pink-500" />
              My Wishlist Hub
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              {wishlistCount > 0 
                ? `${wishlistCount} wishlist item${wishlistCount > 1 ? 's' : ''} to share`
                : "Create wishlists to share with friends"
              }
            </CardDescription>
          </div>
          <Link to="/wishlists" className="text-sm text-pink-600 hover:underline flex items-center whitespace-nowrap">
            Manage <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {wishlistCount > 0 ? (
          <div className="space-y-4">
            <Tabs defaultValue="wishlist" className="w-full">
              <TabsList className="grid grid-cols-2 mb-3">
                <TabsTrigger value="wishlist" className="text-xs">
                  <Heart className="h-3 w-3 mr-1" /> Wishlist ({wishlistCount})
                </TabsTrigger>
                <TabsTrigger value="later" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" /> Saved ({laterCount})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="wishlist" className="space-y-2">
                {wishlistCount > 0 ? (
                  <div className="space-y-2">
                    {(wishlistItems || mockWishlistItems.slice(0, 3)).map((item, index) => (
                      <div key={index} className="flex justify-between text-sm pb-2 border-b last:border-0 last:pb-0 dark:border-gray-700">
                        <p className="truncate">{item.name}</p>
                        <p className="font-medium">{item.price}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No items in your wishlist yet.</p>
                )}
              </TabsContent>

              <TabsContent value="later" className="space-y-2">
                {laterCount > 0 ? (
                  <div className="space-y-2">
                    {(laterItems || mockLaterItems).map((item, index) => (
                      <div key={index} className="flex justify-between text-sm pb-2 border-b last:border-0 last:pb-0 dark:border-gray-700">
                        <p className="truncate">{item.name}</p>
                        <p className="font-medium">{item.price}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No items saved for later.</p>
                )}
              </TabsContent>
            </Tabs>
            
            <Button className="w-full" size="sm" asChild>
              <Link to="/wishlists">View All Gifts</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center py-4">
              <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Start Your Wishlist</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Create wishlists so friends and family know exactly what you'd love to receive.
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

export default GiftsCard;
