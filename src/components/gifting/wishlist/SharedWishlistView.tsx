
import React from "react";
import { Wishlist } from "@/types/profile";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, User } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import WishlistCategoryBadge from "./categories/WishlistCategoryBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import WishlistItemsGrid from "./WishlistItemsGrid";
import { normalizeImageUrl } from "@/utils/normalizeImageUrl";

interface SharedWishlistViewProps {
  wishlist: Wishlist;
  owner: {
    name: string;
    image?: string;
    id: string;
  };
}

const SharedWishlistView: React.FC<SharedWishlistViewProps> = ({ 
  wishlist,
  owner
}) => {
  const wishlistDate = new Date(wishlist.created_at);
  const formattedDate = format(wishlistDate, "MMMM d, yyyy");
  const itemCount = wishlist.items.length;
  
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <Link to="/wishlists" className="flex items-center text-sm text-muted-foreground mb-2 hover:text-foreground transition-colors">
            <ArrowLeft className="h-3 w-3 mr-1" />
            Back to wishlists
          </Link>
          
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold">{wishlist.title}</h1>
            {wishlist.category && (
              <WishlistCategoryBadge category={wishlist.category} />
            )}
          </div>
          
          {wishlist.description && (
            <p className="text-muted-foreground mt-2">{wishlist.description}</p>
          )}
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center">
            <Avatar className="h-8 w-8 mr-2">
              <AvatarImage 
                src={normalizeImageUrl(owner.image, { bucket: 'avatars' })}
                onError={(e) => {
                  console.warn('Failed to load owner avatar:', owner.image);
                  e.currentTarget.style.display = 'none';
                }}
              />
              <AvatarFallback>{owner.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm font-medium">{owner.name}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 mr-1" />
                {formattedDate}
              </div>
            </div>
          </div>
          
          <Link to={`/user/${owner.id}`}>
            <Button size="sm" variant="outline" className="flex items-center gap-1">
              <User className="h-3 w-3 mr-1" />
              View Profile
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Wishlist Content */}
      <WishlistItemsGrid 
        items={wishlist.items}
        onSaveItem={() => {}} // No save functionality on shared wishlists
        savingItemId={null}
      />
    </div>
  );
};

export default SharedWishlistView;
