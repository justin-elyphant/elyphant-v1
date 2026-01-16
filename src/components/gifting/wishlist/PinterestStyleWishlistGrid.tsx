import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { normalizeImageUrl } from "@/utils/normalizeImageUrl";
import { Heart, ShoppingBag, MoreHorizontal, Eye, Share2, Trash2 } from "lucide-react";
import { Wishlist, WishlistItem } from "@/types/profile";
import { useNavigate } from "react-router-dom";
import { cn, formatPrice, validateAndNormalizePrice } from "@/lib/utils";
import WishlistShareButton from "./share/WishlistShareButton";
import ShareStatusBadge from "./ShareStatusBadge";
import WishlistCategoryBadge from "./categories/WishlistCategoryBadge";

interface PinterestStyleWishlistGridProps {
  wishlists: Wishlist[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateSharing: (wishlistId: string, isPublic: boolean) => Promise<boolean>;
}

const getImageAspectRatio = (index: number) => {
  // Use consistent square aspect ratio for uniform card heights
  return 'bleed-square';
};

const getItemPreviewImages = (items: WishlistItem[], maxImages: number = 3) => {
  return items
    .filter(item => item.image_url && item.image_url !== '/placeholder.svg')
    .slice(0, maxImages)
    .map(item => ({
      url: item.image_url,
      name: item.name,
      price: item.price
    }));
};

const WishlistMasonryCard: React.FC<{
  wishlist: Wishlist;
  index: number;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateSharing: (wishlistId: string, isPublic: boolean) => Promise<boolean>;
}> = ({ wishlist, index, onEdit, onDelete, onUpdateSharing }) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  
  const previewImages = getItemPreviewImages(wishlist.items);
  const aspectRatio = getImageAspectRatio(index);
  
  const handleCardClick = () => {
    navigate(`/wishlist/${wishlist.id}`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(wishlist.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(wishlist.id);
  };

  return (
    <Card 
      className={cn(
        "masonry-item pinterest-hover cursor-pointer group relative overflow-hidden",
        "border-border/50 hover:border-primary/20"
      )}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Privacy Status Indicator */}
      <div className="absolute top-2 right-2 z-10">
        <ShareStatusBadge 
          isPublic={wishlist.is_public}
          showText={false}
          size="sm"
          className="bg-background/80 backdrop-blur-sm"
        />
      </div>

      {/* Action Overlay */}
      <div className={cn(
        "absolute inset-x-2 top-2 flex justify-between items-start z-20 transition-opacity",
        isHovered ? "opacity-100" : "opacity-0"
      )}>
        <div className="flex gap-1">
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background"
            onClick={handleEdit}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background text-red-500 hover:text-red-700"
            onClick={handleDelete}
            aria-label={`Delete ${wishlist.title} wishlist`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        
        <WishlistShareButton 
          wishlist={wishlist}
          size="sm"
          onShareSettingsChange={onUpdateSharing}
          className="bg-background/80 backdrop-blur-sm hover:bg-background"
        />
      </div>

      {/* Main Image/Preview Section */}
      <div className={cn("relative", aspectRatio)}>
        {previewImages.length > 0 ? (
          <div className="relative w-full h-full">
            {previewImages.length === 1 ? (
              <img
                src={normalizeImageUrl(previewImages[0].url, { bucket: 'product-images', fallback: '/placeholder.svg' })}
                alt={previewImages[0].name}
                className="bleed-image w-full h-full object-cover"
                onError={(e) => {
                  console.warn('Failed to load wishlist image:', previewImages[0].url);
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
            ) : (
              <div className="grid grid-cols-2 gap-1 h-full">
                <img
                  src={previewImages[0].url}
                  alt={previewImages[0].name}
                  className="bleed-image w-full h-full object-cover"
                />
                <div className="flex flex-col gap-1">
                  {previewImages.slice(1, 3).map((img, idx) => (
                    <img
                      key={idx}
                      src={normalizeImageUrl(img.url, { bucket: 'product-images', fallback: '/placeholder.svg' })}
                      alt={img.name}
                      className="bleed-image w-full h-full object-cover flex-1"
                      onError={(e) => {
                        console.warn('Failed to load wishlist grid image:', img.url);
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                  ))}
                  {wishlist.items.length > 3 && (
                    <div className="bleed-image w-full flex-1 bg-muted/50 backdrop-blur-sm flex items-center justify-center">
                      <span className="text-xs font-medium text-muted-foreground">
                        +{wishlist.items.length - 3}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Item count overlay */}
            <div className="absolute bottom-2 left-2">
              <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-xs">
                {wishlist.items.length} {wishlist.items.length === 1 ? 'item' : 'items'}
              </Badge>
            </div>
          </div>
        ) : (
          <div className={cn("w-full h-full bg-muted/30 flex flex-col items-center justify-center", aspectRatio)}>
            <Heart className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <span className="text-xs text-muted-foreground">Empty wishlist</span>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/marketplace');
              }}
            >
              <ShoppingBag className="h-3 w-3 mr-1" />
              Start Shopping
            </Button>
          </div>
        )}
      </div>

      {/* Card Content */}
      <CardContent className="p-3">
        <div className="space-y-2">
          <div>
            <h3 className="font-medium text-sm line-clamp-1">{wishlist.title}</h3>
            {wishlist.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                {wishlist.description}
              </p>
            )}
          </div>

          {/* Tags and Category */}
          <div className="flex flex-wrap gap-1">
            {wishlist.category && (
              <WishlistCategoryBadge category={wishlist.category} className="text-xs" />
            )}
            
            {wishlist.priority && (
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs",
                  wishlist.priority === 'high' && "border-red-200 text-red-700",
                  wishlist.priority === 'medium' && "border-amber-200 text-amber-700",
                  wishlist.priority === 'low' && "border-blue-200 text-blue-700"
                )}
              >
                {wishlist.priority}
              </Badge>
            )}

            {wishlist.tags?.slice(0, 2).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs smart-tag">
                {tag}
              </Badge>
            ))}
            
            {(wishlist.tags?.length || 0) > 2 && (
              <Badge variant="outline" className="text-xs">
                +{(wishlist.tags?.length || 0) - 2}
              </Badge>
            )}
          </div>

          {/* Quick Stats */}
          {wishlist.items.length > 0 && (
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>
                {wishlist.items.filter(item => item.price && validateAndNormalizePrice(item.price)).length > 0 && (
                  <>Total: {formatPrice(wishlist.items.reduce((sum, item) => sum + (validateAndNormalizePrice(item.price) || 0), 0))}</>
                )}
              </span>
              <span>{new Date(wishlist.updated_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const PinterestStyleWishlistGrid: React.FC<PinterestStyleWishlistGridProps> = ({
  wishlists,
  onEdit,
  onDelete,
  onUpdateSharing
}) => {
  return (
    <div className="masonry-grid">
      {wishlists.map((wishlist, index) => (
        <WishlistMasonryCard
          key={wishlist.id}
          wishlist={wishlist}
          index={index}
          onEdit={onEdit}
          onDelete={onDelete}
          onUpdateSharing={onUpdateSharing}
        />
      ))}
    </div>
  );
};

export default PinterestStyleWishlistGrid;