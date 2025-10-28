import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, ChevronRight } from "lucide-react";
import { Wishlist } from "@/types/profile";
import ShareStatusBadge from "./ShareStatusBadge";
import WishlistCategoryBadge from "./categories/WishlistCategoryBadge";

interface CompactWishlistCardProps {
  wishlist: Wishlist;
  onSelect?: (wishlistId: string) => void;
}

const CompactWishlistCard = ({ wishlist, onSelect }: CompactWishlistCardProps) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(wishlist.id);
    } else {
      navigate(`/wishlist/${wishlist.id}`);
    }
  };

  const getPriorityColor = () => {
    if (!wishlist.priority) return "bg-muted";
    const colors = {
      high: "bg-red-500",
      medium: "bg-amber-500",
      low: "bg-blue-500"
    };
    return colors[wishlist.priority];
  };

  return (
    <Card 
      className="relative overflow-hidden cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 w-[280px] shrink-0"
      onClick={handleCardClick}
    >
      {/* Privacy indicator */}
      <div className="absolute top-2 right-2 z-10">
        <ShareStatusBadge 
          isPublic={wishlist.is_public} 
          showText={false}
          size="sm"
        />
      </div>

      {/* Priority indicator bar */}
      {wishlist.priority && (
        <div className={`h-1 ${getPriorityColor()}`} />
      )}

      <CardContent className="p-4">
        {/* Header */}
        <div className="mb-3">
          <h3 className="font-semibold text-base line-clamp-1 mb-1">
            {wishlist.title}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {wishlist.items.length} {wishlist.items.length === 1 ? 'item' : 'items'}
          </p>
        </div>

        {/* Product thumbnails - horizontal scroll */}
        <div className="flex gap-2 mb-3 overflow-hidden">
          {wishlist.items.slice(0, 3).map((item) => (
            <div 
              key={item.id}
              className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0"
            >
              {item.image_url ? (
                <img 
                  src={item.image_url} 
                  alt={item.title || item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
          {wishlist.items.length === 0 && (
            <div className="w-full h-16 rounded-lg bg-muted flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {wishlist.category && (
            <WishlistCategoryBadge category={wishlist.category} size="sm" />
          )}
          {wishlist.tags?.slice(0, 2).map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
              {tag}
            </Badge>
          ))}
          {wishlist.tags && wishlist.tags.length > 2 && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              +{wishlist.tags.length - 2}
            </Badge>
          )}
        </div>

        {/* View action */}
        <div className="flex items-center justify-between text-xs text-primary font-medium">
          <span>View wishlist</span>
          <ChevronRight className="h-4 w-4" />
        </div>
      </CardContent>
    </Card>
  );
};

export default CompactWishlistCard;
