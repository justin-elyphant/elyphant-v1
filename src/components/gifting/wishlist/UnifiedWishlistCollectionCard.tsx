import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { normalizeImageUrl } from "@/utils/normalizeImageUrl";
import { 
  Heart, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Share2,
  Lock,
  Globe,
  ShoppingBag
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
import { triggerHapticFeedback, HapticPatterns } from "@/utils/haptics";
import WishlistShareButton from "./share/WishlistShareButton";
import WishlistCategoryBadge from "./categories/WishlistCategoryBadge";

export interface UnifiedWishlistCollectionCardProps {
  wishlist: Wishlist;
  variant: 'mobile' | 'tablet' | 'desktop';
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onShare?: (wishlist: Wishlist) => void;
  onUpdateSharing?: (wishlistId: string, isPublic: boolean) => Promise<boolean>;
  className?: string;
}

const UnifiedWishlistCollectionCard: React.FC<UnifiedWishlistCollectionCardProps> = ({
  wishlist,
  variant,
  onEdit,
  onDelete,
  onShare,
  onUpdateSharing,
  className
}) => {
  const navigate = useNavigate();
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Get preview images for 2x2 grid display
  const previewImages = wishlist.items
    .filter(item => item.image_url && item.image_url !== '/placeholder.svg')
    .slice(0, 4)
    .map(item => item.image_url);

  const itemCount = wishlist.items.length;
  const hasItems = itemCount > 0;
  const isMobile = variant === 'mobile';
  const isDesktop = variant === 'desktop';

  const handleCardPress = () => {
    triggerHapticFeedback(HapticPatterns.buttonTap);
    navigate(`/wishlist/${wishlist.id}`);
  };

  const handleEdit = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    triggerHapticFeedback(HapticPatterns.buttonTap);
    onEdit(wishlist.id);
  };

  const handleDelete = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    triggerHapticFeedback(HapticPatterns.removeItem);
    onDelete(wishlist.id);
  };

  const handleShare = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    triggerHapticFeedback(HapticPatterns.buttonTap);
    onShare?.(wishlist);
  };

  const handleStartShopping = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHapticFeedback(HapticPatterns.buttonTap);
    navigate(`/wishlist/${wishlist.id}?openShopping=true`);
  };

  // Render 2x2 image grid
  const renderImageGrid = () => {
    if (!hasItems || previewImages.length === 0) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-muted/30">
          <Heart className="h-8 w-8 text-muted-foreground/25 mb-2" />
          <p className="text-xs text-muted-foreground/60 mb-3">No items yet</p>
          <Button
            variant="default"
            size="sm"
            className="bg-[#DC2626] hover:bg-[#B91C1C] text-white"
            onClick={handleStartShopping}
          >
            <ShoppingBag className="h-3 w-3 mr-1" />
            Start Shopping
          </Button>
        </div>
      );
    }

    if (previewImages.length === 1) {
      return (
        <img
          src={normalizeImageUrl(previewImages[0], { bucket: 'product-images', fallback: '/placeholder.svg' })}
          alt="Preview"
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = '/placeholder.svg';
          }}
        />
      );
    }

    return (
      <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-0.5">
        {[...Array(4)].map((_, index) => (
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
        ))}
      </div>
    );
  };

  // Privacy indicator component
  const PrivacyIndicator = () => (
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
  );

  // Mobile: Dropdown menu for actions
  const MobileActionMenu = () => (
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
          <DropdownMenuItem onClick={() => navigate(`/wishlist/${wishlist.id}`)}>
            <Eye className="h-4 w-4 mr-2" />
            View
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
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
  );

  // Desktop/Tablet: Hover overlay for actions
  const HoverActionOverlay = () => (
    <div className={cn(
      "absolute inset-x-2 top-2 flex justify-between items-start z-20 transition-all duration-200",
      isHovered ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
    )}>
      <div className="flex gap-1">
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/wishlist/${wishlist.id}`);
          }}
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background"
          onClick={handleEdit}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background text-[#DC2626] hover:text-[#B91C1C]"
          onClick={handleDelete}
          aria-label={`Delete ${wishlist.title} wishlist`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      
      {onUpdateSharing && (
        <WishlistShareButton 
          wishlist={wishlist}
          size="sm"
          onShareSettingsChange={onUpdateSharing}
          className="bg-background/80 backdrop-blur-sm hover:bg-background"
        />
      )}
    </div>
  );

  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all duration-200 border-border/40 bg-card cursor-pointer",
        // Touch optimization
        "touch-manipulation",
        "-webkit-tap-highlight-color-transparent",
        // Press/active feedback
        "active:scale-[0.97]",
        isPressed && "scale-[0.97]",
        // Hover states for desktop
        !isMobile && "hover:shadow-md hover:border-primary/20",
        className
      )}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => {
        setIsPressed(false);
        setIsHovered(false);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onClick={handleCardPress}
    >
      {/* Square Image Area */}
      <div className="relative aspect-square bg-muted overflow-hidden rounded-t-lg">
        {/* Privacy Indicator - Always visible top-left */}
        <PrivacyIndicator />

        {/* Actions - Mobile uses dropdown, Desktop/Tablet uses hover overlay */}
        {isMobile ? <MobileActionMenu /> : <HoverActionOverlay />}

        {/* Image Grid */}
        {renderImageGrid()}

        {/* Item count badge - bottom left */}
        {hasItems && (
          <div className="absolute bottom-2 left-2">
            <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-xs">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </Badge>
          </div>
        )}
      </div>

      {/* Text Content Below Image */}
      <div className={cn("p-3", isDesktop && "p-4")}>
        <h3 className={cn(
          "font-medium line-clamp-1 text-foreground",
          isMobile ? "text-sm" : "text-base"
        )}>
          {wishlist.title}
        </h3>
        
        {wishlist.description && !isMobile && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
            {wishlist.description}
          </p>
        )}

        {/* Tags and Category - Only show on tablet/desktop */}
        {!isMobile && (
          <div className="flex flex-wrap gap-1 mt-2">
            {wishlist.category && (
              <WishlistCategoryBadge category={wishlist.category} className="text-xs" />
            )}
            
            {wishlist.priority && (
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs bg-gray-50 border-gray-200",
                  wishlist.priority === 'high' && "border-red-200 text-red-700 bg-red-50",
                  wishlist.priority === 'medium' && "border-amber-200 text-amber-700 bg-amber-50",
                  wishlist.priority === 'low' && "border-blue-200 text-blue-700 bg-blue-50"
                )}
              >
                {wishlist.priority}
              </Badge>
            )}

            {wishlist.tags?.slice(0, 2).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs bg-gray-50 text-gray-700 border-gray-200">
                {tag}
              </Badge>
            ))}
            
            {(wishlist.tags?.length || 0) > 2 && (
              <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700 border-gray-200">
                +{(wishlist.tags?.length || 0) - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Mobile: Just item count */}
        {isMobile && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </p>
        )}
      </div>
    </Card>
  );
};

export default UnifiedWishlistCollectionCard;
