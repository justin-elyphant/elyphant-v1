
import React from "react";
import { Gift, Heart, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFavorites } from "@/components/gifting/hooks/useFavorites";

const GiftsCard = () => {
  const { laterItems, wishlistItems } = useFavorites();
  const laterCount = laterItems.length;
  const wishlistCount = wishlistItems.length;
  const totalCount = laterCount + wishlistCount;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center">
          <Gift className="h-5 w-5 mr-2 text-purple-500" />
          My Gifts
        </CardTitle>
        <CardDescription>
          Manage your wishlists and saved items
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="wishlist" className="w-full">
          <TabsList className="grid grid-cols-2 mb-3">
            <TabsTrigger value="wishlist" className="text-xs">
              <Heart className="h-3 w-3 mr-1" /> My Wishlist ({wishlistCount})
            </TabsTrigger>
            <TabsTrigger value="later" className="text-xs">
              <Clock className="h-3 w-3 mr-1" /> Save for Later ({laterCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="wishlist" className="space-y-2">
            {wishlistCount > 0 ? (
              <p className="text-sm">{wishlistCount} items in your wishlist</p>
            ) : (
              <p className="text-sm text-muted-foreground">No items in your wishlist yet.</p>
            )}
          </TabsContent>

          <TabsContent value="later" className="space-y-2">
            {laterCount > 0 ? (
              <p className="text-sm">{laterCount} items saved for later</p>
            ) : (
              <p className="text-sm text-muted-foreground">No items saved for later.</p>
            )}
          </TabsContent>
          
          <div className="mt-4">
            <Button className="w-full" size="sm" asChild>
              <Link to="/user/me?tab=favorites">
                View all saved items
              </Link>
            </Button>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default GiftsCard;
