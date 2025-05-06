
import React from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { 
  Popover,
  PopoverTrigger,
  PopoverContent
} from "@/components/ui/popover";
import { useAuth } from "@/contexts/auth";

interface FavoritesDropdownProps {
  onSignUpRequired?: () => void;
}

const FavoritesDropdown = ({ onSignUpRequired }: FavoritesDropdownProps) => {
  const { user } = useAuth();

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
          className="h-8 border-none"
          onClick={handleClick}
        >
          <Heart className="h-4 w-4 mr-1.5" />
          Favorites
        </Button>
      </PopoverTrigger>
      {user && (
        <PopoverContent className="w-80">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Your Favorites</h4>
            <div className="text-sm text-muted-foreground">
              You haven't added any favorites yet.
            </div>
          </div>
        </PopoverContent>
      )}
    </Popover>
  );
};

export default FavoritesDropdown;
