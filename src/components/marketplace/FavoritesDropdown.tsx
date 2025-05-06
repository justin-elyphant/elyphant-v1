
import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Heart } from "lucide-react";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";
import { WishlistData } from "@/components/gifting/wishlist/WishlistCard";
import { useNavigate } from "react-router-dom";

const FavoritesDropdown = () => {
  const [wishlists] = useLocalStorage<WishlistData[]>("userWishlists", []);
  const navigate = useNavigate();
  
  // Get all favorited items across all wishlists
  const favoriteItems = wishlists.flatMap(wishlist => wishlist.items);
  const uniqueFavorites = Array.from(new Set(favoriteItems.map(item => item.id)))
    .map(id => favoriteItems.find(item => item.id === id))
    .filter(item => item !== undefined)
    .slice(0, 5); // Show only the first 5 items

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Heart className="h-4 w-4" />
          My Favorites
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Recent Favorites</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {uniqueFavorites.length > 0 ? (
          <>
            {uniqueFavorites.map((item) => (
              <DropdownMenuItem key={item.id} className="flex flex-col items-start">
                <span className="font-medium">{item.name}</span>
                <span className="text-sm text-muted-foreground">${item.price}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/wishlists")}>
              View all favorites
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem disabled>No favorites yet</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default FavoritesDropdown;
