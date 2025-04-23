
import React from "react";
import { Link } from "react-router-dom";
import { Heart, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFavorites } from "@/components/gifting/hooks/useFavorites";

const GiftsCard = () => {
  const { laterItems, wishlistItems } = useFavorites();
  const laterCount = laterItems?.length || 0;
  const wishlistCount = wishlistItems?.length || 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center">
          <Heart className="h-5 w-5 mr-2 text-purple-500" />
          My Gifts
        </CardTitle>
        <CardDescription className="text-sm">
          Manage your wishlists and saved items
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="wishlist" className="w-full">
          <TabsList className="grid grid-cols-2 mb-3">
            <TabsTrigger value="wishlist" className="text-sm">
              <Heart className="h-4 w-4 mr-1" /> My Wishlist ({wishlistCount})
            </TabsTrigger>
            <TabsTrigger value="later" className="text-sm">
              <Clock className="h-4 w-4 mr-1" /> Save for Later ({laterCount})
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
          
          <Button className="w-full mt-4" size="sm" asChild>
            <Link to="/wishlists">View All Gifts</Link>
          </Button>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default GiftsCard;
