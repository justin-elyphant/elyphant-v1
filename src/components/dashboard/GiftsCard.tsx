
import React from "react";
import { Link } from "react-router-dom";
import { Heart, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFavorites } from "@/components/gifting/hooks/useFavorites";

const GiftsCard = () => {
  const { laterItems, wishlistItems } = useFavorites();

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

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center">
          <Heart className="h-5 w-5 mr-2 text-purple-500" />
          My Gifts
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Manage your wishlists and saved items
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="wishlist" className="w-full">
          <TabsList className="grid grid-cols-2 mb-3">
            <TabsTrigger value="wishlist" className="text-xs">
              <Heart className="h-3 w-3 mr-1" /> Wishlist ({wishlistCount})
            </TabsTrigger>
            <TabsTrigger value="later" className="text-xs">
              <Clock className="h-3 w-3 mr-1" /> Save for Later ({laterCount})
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
          
          <Button className="w-full mt-4" size="sm" asChild>
            <Link to="/wishlists">View All Gifts</Link>
          </Button>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default GiftsCard;
