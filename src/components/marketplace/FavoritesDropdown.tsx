
import React from "react";
import { Button } from "@/components/ui/button";
import { Heart, ExternalLink, List, Share2 } from "lucide-react";
import { 
  Popover,
  PopoverTrigger,
  PopoverContent
} from "@/components/ui/popover";
import { useAuth } from "@/contexts/auth";
import { useFavorites } from "@/components/gifting/hooks/useFavorites";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useWishlist } from "@/components/gifting/hooks/useWishlist";
import ShareStatusBadge from "@/components/gifting/wishlist/ShareStatusBadge";

interface FavoritesDropdownProps {
  onSignUpRequired?: () => void;
}

const FavoritesDropdown = ({ onSignUpRequired }: FavoritesDropdownProps) => {
  const { user } = useAuth();
  const { favorites = [] } = useFavorites();
  const { wishlists, updateWishlistSharing } = useWishlist();
  const navigate = useNavigate();
  
  // Count total items across all wishlists
  const totalItemsCount = wishlists?.reduce(
    (count, wishlist) => count + (wishlist.items?.length || 0), 
    0
  ) || favorites.length;

  const handleClick = () => {
    if (!user && onSignUpRequired) {
      onSignUpRequired();
    }
  };

  const handleViewAll = () => {
    navigate('/wishlists');
  };

  const handleShare = (e: React.MouseEvent, wishlistId: string) => {
    e.stopPropagation();
    navigate(`/shared-wishlist/${wishlistId}`);
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
          Wishlist
          {user && totalItemsCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground text-xs rounded-full">
              {totalItemsCount > 99 ? '99+' : totalItemsCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      {user && (
        <PopoverContent className="w-80 p-0" align="end">
          <div className="p-3 border-b">
            <h4 className="font-medium flex items-center justify-between">
              <span>Your Wishlists</span>
              {totalItemsCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
                </Badge>
              )}
            </h4>
          </div>
          
          {wishlists && wishlists.length > 0 ? (
            <div className="max-h-60 overflow-y-auto divide-y">
              {wishlists.map((wishlist) => (
                <div key={wishlist.id} className="p-3 hover:bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium text-sm">{wishlist.title}</p>
                          <ShareStatusBadge 
                            isPublic={wishlist.is_public} 
                            showText={false}
                            size="sm"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {wishlist.items.length} {wishlist.items.length === 1 ? 'item' : 'items'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {wishlist.is_public && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-7 px-2"
                          onClick={(e) => handleShare(e, wishlist.id)}
                        >
                          <Share2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => navigate(`/wishlists`)}
                      >
                        <List className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  {wishlist.items.length > 0 && (
                    <div className="flex gap-1 mt-2 overflow-x-auto pb-1">
                      {wishlist.items.slice(0, 4).map((item, idx) => (
                        <div 
                          key={item.id || idx} 
                          className="h-12 w-12 flex-shrink-0 rounded overflow-hidden border"
                          title={item.name}
                        >
                          {item.image_url ? (
                            <img 
                              src={item.image_url} 
                              alt={item.name} 
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-muted flex items-center justify-center">
                              <Heart className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      ))}
                      {wishlist.items.length > 4 && (
                        <div className="h-12 w-12 flex-shrink-0 rounded overflow-hidden bg-muted flex items-center justify-center">
                          <span className="text-xs font-medium">+{wishlist.items.length - 4}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Heart className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <div className="text-sm text-muted-foreground">
                No items in your wishlist yet
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Click the heart icon on any product to add it
              </p>
            </div>
          )}
          
          <div className="p-3 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={handleViewAll}
            >
              <ExternalLink className="mr-2 h-3.5 w-3.5" /> 
              View All Wishlists
            </Button>
          </div>
        </PopoverContent>
      )}
    </Popover>
  );
};

export default FavoritesDropdown;
