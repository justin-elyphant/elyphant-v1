
import React from "react";
import { Link } from "react-router-dom";
import { Heart, ChevronRight, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFavorites } from "@/components/gifting/hooks/useFavorites";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const FavoritesCard = () => {
  const { laterItems, wishlistItems } = useFavorites();
  const laterCount = laterItems.length;
  const wishlistCount = wishlistItems.length;
  const totalCount = laterCount + wishlistCount;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center">
          <Heart className="h-5 w-5 mr-2 text-red-500" />
          My Favorites
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="later" className="w-full">
          <TabsList className="grid grid-cols-2 mb-2">
            <TabsTrigger value="later" className="text-xs">
              <Clock className="h-3 w-3 mr-1" /> Save for Later ({laterCount})
            </TabsTrigger>
            <TabsTrigger value="wishlist" className="text-xs">
              <Heart className="h-3 w-3 mr-1" /> My Wishlist ({wishlistCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="later">
            {laterCount > 0 ? (
              <p className="text-sm">{laterCount} items saved for later</p>
            ) : (
              <p className="text-sm text-muted-foreground">No items saved for later.</p>
            )}
          </TabsContent>

          <TabsContent value="wishlist">
            {wishlistCount > 0 ? (
              <p className="text-sm">{wishlistCount} items in your wishlist</p>
            ) : (
              <p className="text-sm text-muted-foreground">No items in your wishlist.</p>
            )}
          </TabsContent>
          
          <div className="mt-4">
            <Link 
              to="/user/me?tab=favorites" 
              className="text-purple-600 hover:underline text-sm flex items-center"
            >
              View all favorites <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default FavoritesCard;
