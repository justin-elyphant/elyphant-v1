
import React from "react";
import { Link } from "react-router-dom";
import { Heart, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFavorites } from "@/components/gifting/hooks/useFavorites";

const FavoritesCard = () => {
  const { favoriteItems } = useFavorites();
  const favoritesCount = favoriteItems.length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center">
          <Heart className="h-5 w-5 mr-2 text-red-500" />
          My Favorites
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm">
          {favoritesCount > 0 ? (
            <p>{favoritesCount} products saved</p>
          ) : (
            <p className="text-muted-foreground">You haven't saved any favorites yet.</p>
          )}
          
          <div className="mt-4">
            <Link 
              to="/user/me?tab=favorites" 
              className="text-purple-600 hover:underline text-sm flex items-center"
            >
              View all favorites <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FavoritesCard;
