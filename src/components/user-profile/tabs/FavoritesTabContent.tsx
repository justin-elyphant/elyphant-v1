
import React from "react";
import { Heart } from "lucide-react";

const FavoritesTabContent = () => {
  return (
    <div className="text-center py-8 border rounded-lg">
      <Heart className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
      <h4 className="font-medium">No favorites yet</h4>
      <p className="text-sm text-muted-foreground mt-1">
        Favorited items will appear here.
      </p>
    </div>
  );
};

export default FavoritesTabContent;
