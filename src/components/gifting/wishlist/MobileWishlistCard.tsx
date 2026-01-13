import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { normalizeImageUrl } from "@/utils/normalizeImageUrl";
import { 
  Heart, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Share2,
  Lock,
  Globe
} from "lucide-react";
import { Wishlist } from "@/types/profile";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MobileWishlistCardProps {
  wishlist: Wishlist;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onShare?: (wishlist: Wishlist) => void;
  className?: string;
}

const MobileWishlistCard: React.FC<MobileWishlistCardProps> = ({
  wishlist,
  onEdit,
  onDelete,
  onShare,
  className
}) => {
  const navigate = useNavigate();
  const [isPressed, setIsPressed] = useState(false);

  const handleCardPress = () => {
    navigate(`/wishlist/${wishlist.id}`);
  };

  const handleEdit = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onEdit(wishlist.id);
  };

  const handleDelete = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onDelete(wishlist.id);
  };

  const handleShare = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onShare?.(wishlist);
  };

  // Get preview images for 2x2 grid display (always 4 slots)
  const previewImages = wishlist.items
    .filter(item => item.image_url && item.image_url !== '/placeholder.svg')
    .slice(0, 4)
    .map(item => item.image_url);

  const itemCount = wishlist.items.length;
  const hasItems = itemCount > 0;

  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all duration-200 border-border/40 bg-card",
        "active:scale-[0.97]",
        isPressed && "scale-[0.97]",
        className
      )}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onClick={handleCardPress}
    >
      {/* Square Image Area */}
      <div className="relative aspect-square bg-muted overflow-hidden rounded-t-lg">
        {/* Privacy Icon - Top Left */}
        <div className="absolute top-2 left-2 z-10">
          <div className={cn(
            "h-7 w-7 rounded-full flex items-center justify-center",
            "bg-background/80 backdrop-blur-sm shadow-sm"
          )}>
            {wishlist.is_public ? (
              <Globe className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Action Menu - Top Right */}
        <div className="absolute top-2 right-2 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="h-7 w-7 p-0 rounded-full bg-background/80 backdrop-blur-sm border-0 shadow-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/wishlist/${wishlist.id}`)}>
                <Eye className="h-4 w-4 mr-2" />
                View
              </DropdownMenuItem>
              {onShare && (
                <DropdownMenuItem onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Image Grid */}
        {hasItems && previewImages.length > 0 ? (
          <div className={cn(
            "w-full h-full grid gap-0.5",
            previewImages.length === 1 && "grid-cols-1 grid-rows-1",
            previewImages.length >= 2 && "grid-cols-2 grid-rows-2"
          )}>
            {previewImages.length === 1 ? (
              // Single image - full bleed
              <img
                src={normalizeImageUrl(previewImages[0], { bucket: 'product-images', fallback: '/placeholder.svg' })}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
            ) : (
              // 2x2 grid
              [...Array(4)].map((_, index) => (
                <div key={index} className="relative overflow-hidden bg-muted/50">
                  {previewImages[index] ? (
                    <>
                      <img
                        src={normalizeImageUrl(previewImages[index], { bucket: 'product-images', fallback: '/placeholder.svg' })}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                      {/* +N overlay on last cell if more items */}
                      {index === 3 && itemCount > 4 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            +{itemCount - 4}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full bg-muted/30" />
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          // Empty state
          <div className="w-full h-full flex flex-col items-center justify-center">
            <Heart className="h-8 w-8 text-muted-foreground/25 mb-2" />
            <p className="text-xs text-muted-foreground/60">No items yet</p>
          </div>
        )}
      </div>

      {/* Minimal Text Below Image */}
      <div className="p-3">
        <h3 className="font-medium text-sm line-clamp-1 text-foreground">
          {wishlist.title}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </p>
      </div>
    </Card>
  );
};

export default MobileWishlistCard;