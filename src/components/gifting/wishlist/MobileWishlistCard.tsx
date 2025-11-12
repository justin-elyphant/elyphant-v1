import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { normalizeImageUrl } from "@/utils/normalizeImageUrl";
import { 
  Heart, 
  ShoppingBag, 
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
import { cn, formatPrice, validateAndNormalizePrice } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import WishlistCategoryBadge from "./categories/WishlistCategoryBadge";

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

  const handleStartShopping = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/marketplace');
  };

  // Get preview images for display
  const previewImages = wishlist.items
    .filter(item => item.image_url && item.image_url !== '/placeholder.svg')
    .slice(0, 4)
    .map(item => item.image_url);

  // Calculate total value
  const totalValue = wishlist.items.reduce((sum, item) => {
    const price = validateAndNormalizePrice(item.price);
    return sum + (price || 0);
  }, 0);

  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all duration-200 border-border/50",
        "active:scale-[0.98] active:shadow-sm", // iOS-style press feedback
        isPressed && "scale-[0.98] shadow-sm",
        className
      )}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onClick={handleCardPress}
    >
      {/* Privacy Status Indicator */}
      <div className="absolute top-3 right-3 z-10">
        <div className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
          "bg-background/90 backdrop-blur-sm border",
          wishlist.is_public 
            ? "text-green-700 border-green-200 bg-green-50/90" 
            : "text-gray-700 border-gray-200 bg-gray-50/90"
        )}>
          {wishlist.is_public ? (
            <>
              <Globe className="h-3 w-3" />
              <span className="hidden sm:inline">Public</span>
            </>
          ) : (
            <>
              <Lock className="h-3 w-3" />
              <span className="hidden sm:inline">Private</span>
            </>
          )}
        </div>
      </div>

      {/* Action Menu */}
      <div className="absolute top-3 left-3 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              className="h-8 w-8 p-0 rounded-full bg-background/90 backdrop-blur-sm border-0 shadow-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            <DropdownMenuItem onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/wishlist/${wishlist.id}`)}>
              <Eye className="h-4 w-4 mr-2" />
              View All
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

      <CardContent className="p-0">
        {/* Image Preview Section */}
        <div className="relative h-48 bg-muted overflow-hidden">
          {previewImages.length > 0 ? (
            <div className={cn(
              "w-full h-full",
              previewImages.length === 1 && "grid grid-cols-1",
              previewImages.length === 2 && "grid grid-cols-2",
              previewImages.length >= 3 && "grid grid-cols-2 grid-rows-2"
            )}>
              {previewImages.map((imageUrl, index) => (
                <div
                  key={index}
                  className={cn(
                    "relative overflow-hidden",
                    previewImages.length >= 3 && index === 0 && "row-span-2",
                    previewImages.length >= 3 && index > 0 && "h-full"
                  )}
                >
                  <img
                    src={normalizeImageUrl(imageUrl, { bucket: 'product-images', fallback: '/placeholder.svg' })}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                    onError={(e) => {
                      console.warn('Failed to load wishlist preview image:', imageUrl);
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                  {/* Show +N more for remaining items */}
                  {index === 3 && wishlist.items.length > 4 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-semibold text-lg">
                        +{wishlist.items.length - 4}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-6">
              <Heart className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                This wishlist is empty
              </p>
              <Button 
                variant="outline" 
                size="sm"
                className="rounded-full"
                onClick={handleStartShopping}
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                Start Shopping
              </Button>
            </div>
          )}

          {/* Item count overlay */}
          {wishlist.items.length > 0 && (
            <div className="absolute bottom-2 left-2">
              <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm rounded-full">
                {wishlist.items.length} {wishlist.items.length === 1 ? 'item' : 'items'}
              </Badge>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4 space-y-3">
          {/* Title and Description */}
          <div>
            <h3 className="font-semibold text-base line-clamp-1 text-foreground">
              {wishlist.title}
            </h3>
            {wishlist.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {wishlist.description}
              </p>
            )}
          </div>

          {/* Tags and Metadata */}
          <div className="flex flex-wrap gap-2">
            {wishlist.category && (
              <WishlistCategoryBadge category={wishlist.category} className="text-xs" />
            )}
            
            {wishlist.priority && (
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs rounded-full",
                  wishlist.priority === 'high' && "border-red-200 text-red-700 bg-red-50",
                  wishlist.priority === 'medium' && "border-amber-200 text-amber-700 bg-amber-50",
                  wishlist.priority === 'low' && "border-blue-200 text-blue-700 bg-blue-50"
                )}
              >
                {wishlist.priority} priority
              </Badge>
            )}

            {wishlist.tags?.slice(0, 2).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs rounded-full bg-muted/50">
                {tag}
              </Badge>
            ))}
            
            {(wishlist.tags?.length || 0) > 2 && (
              <Badge variant="outline" className="text-xs rounded-full bg-muted/50">
                +{(wishlist.tags?.length || 0) - 2}
              </Badge>
            )}
          </div>

          {/* Stats Row */}
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <div className="flex items-center gap-3">
              {totalValue > 0 && (
                <span className="font-medium text-foreground">
                  {formatPrice(totalValue)}
                </span>
              )}
              <span>
                Updated {new Date(wishlist.updated_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Action Button */}
          {wishlist.items.length > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full rounded-xl h-10"
              onClick={handleStartShopping}
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              Add More Items
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MobileWishlistCard;