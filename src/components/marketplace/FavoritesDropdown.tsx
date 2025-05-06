
import React from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { 
  Popover,
  PopoverTrigger,
  PopoverContent
} from "@/components/ui/popover";
import { useAuth } from "@/contexts/auth";
import { useFavorites } from "@/components/gifting/hooks/useFavorites";
import { Badge } from "@/components/ui/badge";

interface FavoritesDropdownProps {
  onSignUpRequired?: () => void;
}

const FavoritesDropdown = ({ onSignUpRequired }: FavoritesDropdownProps) => {
  const { user } = useAuth();
  const { favorites = [] } = useFavorites();

  const handleClick = () => {
    if (!user && onSignUpRequired) {
      onSignUpRequired();
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 border-none relative"
          onClick={handleClick}
        >
          <Heart className="h-4 w-4 mr-1.5" />
          Favorites
          {user && favorites.length > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-purple-600 text-white text-xs rounded-full">
              {favorites.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      {user && (
        <PopoverContent className="w-80" align="start">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Your Favorites</h4>
            {favorites.length > 0 ? (
              <div className="max-h-60 overflow-y-auto">
                {favorites.map((favorite) => (
                  <div key={favorite} className="text-sm flex items-center gap-2 py-2 border-b last:border-0">
                    <Heart className="h-3 w-3 text-rose-500 fill-rose-500" />
                    <span className="text-sm text-muted-foreground">{favorite}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Heart className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <div className="text-sm text-muted-foreground">
                  You haven't added any favorites yet.
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Click the heart icon on any product to add it to your favorites.
                </p>
              </div>
            )}
          </div>
        </PopoverContent>
      )}
    </Popover>
  );
};

export default FavoritesDropdown;
