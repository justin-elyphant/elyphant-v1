
import React from "react";
import { Wishlist } from "@/types/profile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Calendar, Clock, ExternalLink, User } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { formatCurrency } from "@/lib/utils";
import AddToCartButton from "@/components/marketplace/components/AddToCartButton";
import WishlistCategoryBadge from "./categories/WishlistCategoryBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
              <AvatarImage src={owner.image || undefined} />
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
      {itemCount > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {wishlist.items.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <AspectRatio ratio={1} className="bg-muted">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-muted">
                    <span className="text-muted-foreground">No image</span>
                  </div>
                )}
              </AspectRatio>
              <CardContent className="p-4">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h3 className="font-medium text-sm line-clamp-2">{item.name}</h3>
                  {item.price && (
                    <div className="shrink-0 text-sm font-medium">
                      {formatCurrency(item.price)}
                    </div>
                  )}
                </div>
                
                {item.brand && (
                  <p className="text-xs text-muted-foreground mb-3">{item.brand}</p>
                )}
                
                <div className="flex items-center justify-between mt-2 gap-2">
                  <div className="text-xs text-muted-foreground flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    Added {format(new Date(item.added_at), "MMM d")}
                  </div>
                  
                  <Link 
                    to={`/marketplace?productId=${item.product_id}`}
                    className="text-xs text-primary hover:underline flex items-center"
                  >
                    View <ExternalLink className="h-3 w-3 ml-0.5" />
                  </Link>
                </div>
                
                <div className="mt-4">
                  <AddToCartButton 
                    product={{ 
                      product_id: item.product_id, 
                      title: item.name, 
                      price: item.price || 0, 
                      image: item.image_url || '',
                      brand: item.brand 
                    }} 
                    size="sm"
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-muted/30 rounded-lg border">
          <p className="text-muted-foreground">This wishlist is empty</p>
        </div>
      )}
    </div>
  );
};

export default SharedWishlistView;
