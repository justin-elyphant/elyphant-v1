import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, ShoppingCart, Trash2, Gift, ExternalLink, Calendar, Check, Copy, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { normalizeImageUrl } from "@/utils/normalizeImageUrl";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatPrice } from "@/lib/utils";
import { WishlistItem } from "@/types/profile";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { triggerHapticFeedback } from "@/utils/haptics";
import { Product } from "@/types/product";

interface EnhancedWishlistCardProps {
  item: WishlistItem;
  onRemove?: () => void;
  isRemoving?: boolean;
  onGiftNow?: (item: WishlistItem) => void;
  onScheduleGift?: (item: WishlistItem) => void;
  // Bulk selection props
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelectionChange?: (itemId: string, selected: boolean) => void;
  // Guest/public view props
  isPurchased?: boolean;
  onCopyToWishlist?: (item: WishlistItem) => void;
  isGuestView?: boolean;
  // Guest purchase mode
  onAddToCart?: () => void;
  onScheduleAndAddToCart?: () => void;
  // Style props
  className?: string;
}

const EnhancedWishlistCard = ({ 
  item, 
  onRemove,
  isRemoving = false,
  onGiftNow,
  onScheduleGift,
  isSelectionMode = false,
  isSelected = false,
  onSelectionChange,
  isPurchased = false,
  onCopyToWishlist,
  isGuestView = false,
  onAddToCart,
  onScheduleAndAddToCart,
  className
}: EnhancedWishlistCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    onRemove?.();
    setShowDeleteDialog(false);
  };

  const handleGiftNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    onGiftNow?.(item);
  };

  const handleScheduleGift = (e: React.MouseEvent) => {
    e.stopPropagation();
    onScheduleGift?.(item);
  };

  const handleCopyToWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopyToWishlist?.(item);
  };
  
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHapticFeedback('success');
    try {
      // Cast item to Product and extract wishlist ID from enhanced item
      const wishlistId = (item as any).wishlistId || '';
      
      await addToCart(
        item as any, // Cast WishlistItem to Product
        1,
        wishlistId ? { 
          wishlist_id: wishlistId, 
          wishlist_item_id: item.id 
        } : undefined
      );
      toast.success(`Added ${item.title || item.name} to cart`);
    } catch (error) {
      console.error('Failed to add wishlist item to cart:', error);
      toast.error('Failed to add to cart');
    }
  };

  const handleSelectionChange = (checked: boolean) => {
    onSelectionChange?.(item.id, checked);
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    const productId = item.product_id || item.id;
    const productData = {
      id: productId,
      product_id: productId,
      title: item.name || item.title || "Product",
      name: item.name || item.title || "Product",
      price: item.price || 0,
      image: item.image_url || "/placeholder.svg",
      images: [item.image_url || "/placeholder.svg"],
      brand: item.brand || "",
      rating: (item as any).stars || (item as any).rating || 0,
      reviewCount: (item as any).review_count || (item as any).reviews || 0,
      vendor: (item as any).vendor,
      retailer: (item as any).retailer,
      productSource: (item as any).product_source,
      isZincApiProduct: (item as any).isZincApiProduct,
      skipCentsDetection: (item as any).skipCentsDetection,
    };
    
    navigate(`/marketplace/product/${productId}`, {
      state: {
        product: productData,
        context: 'wishlist',
        returnPath: window.location.pathname
      }
    });
  };

  const formattedPrice = formatPrice(item.price);

  return (
    <>
      <Card className={`group relative overflow-hidden hover:shadow-lg transition-all duration-200 border-border/50 hover:border-primary/20 ios-touch-feedback touch-manipulation active:scale-[0.98] md:active:scale-100 ${
        isSelected ? 'ring-2 ring-primary border-primary' : ''
      } ${isPurchased ? 'opacity-60' : ''} ${className || ''}`}>
        {/* Selection checkbox */}
        {isSelectionMode && (
          <div className="absolute top-3 left-3 z-20">
            <Checkbox
              checked={isSelected}
              onCheckedChange={handleSelectionChange}
              className="bg-background/90 backdrop-blur-sm border-2"
            />
          </div>
        )}

        {/* Action buttons overlay */}
        <div className={`absolute top-3 ${isSelectionMode ? 'right-3' : 'right-3'} z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
          {onRemove && !isSelectionMode && (
            <Button 
              variant="destructive" 
              size="sm" 
              className="h-8 w-8 rounded-full bg-destructive/90 backdrop-blur-sm hover:bg-destructive"
              onClick={handleDeleteClick}
              disabled={isRemoving}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
          {!isSelectionMode && (
            <Button 
              variant="secondary" 
              size="sm" 
              className="h-8 w-8 rounded-full bg-background/90 backdrop-blur-sm hover:bg-muted"
            >
              <Heart className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        {/* Product source badge or Purchased/Gifted badge */}
        {isPurchased ? (
          <div className="absolute top-3 left-3 z-10">
            <Badge className="text-xs bg-green-500 text-white border-green-600">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {isGuestView ? 'Purchased' : 'Gifted 🎁'}
            </Badge>
          </div>
        ) : (item as any).product_source === 'zinc_api' && !isSelectionMode ? (
          <div className="absolute top-3 left-3 z-10">
            <Badge variant="secondary" className="text-xs bg-background/90 backdrop-blur-sm">
              Amazon
            </Badge>
          </div>
        ) : null}

        <CardContent className="p-0">
          {/* Image - Larger for Babylist feel */}
          <div className="aspect-square bg-muted overflow-hidden cursor-pointer min-h-[240px]" onClick={(e) => !isSelectionMode && handleViewDetails(e)}>
            <img
              src={normalizeImageUrl(item.image_url, { bucket: 'product-images', fallback: '/placeholder.svg' })} 
              alt={item.name || item.title || "Product"}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              onError={(e) => {
                console.warn('Failed to load wishlist item image:', item.image_url);
                e.currentTarget.src = '/placeholder.svg';
              }}
            />
            {isSelected && (
              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                <div className="bg-primary text-primary-foreground rounded-full p-2">
                  <Check className="h-6 w-6" />
                </div>
              </div>
            )}
          </div>
          
          {/* Content - Enhanced spacing and typography */}
          <div className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-medium">
              {item.brand || "Unknown Brand"}
            </p>
            <h3 className="font-semibold mb-3 line-clamp-2 leading-tight text-base">
              {item.name || item.title || "Unknown Item"}
            </h3>
            
            <div className="flex justify-between items-center">
              <p className="font-bold text-xl">{formattedPrice}</p>
              {!isSelectionMode && !isPurchased && (
                <div className="flex gap-2">
                  {/* Guest view with Add to Cart option */}
                  {isGuestView && onAddToCart ? (
                    <>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={handleViewDetails}
                        className="text-xs"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      {onScheduleAndAddToCart && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerHapticFeedback('success');
                            onScheduleAndAddToCart();
                          }}
                          className="text-xs"
                        >
                          <Calendar className="h-3 w-3 mr-1" />
                          Schedule
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHapticFeedback('success');
                          onAddToCart();
                        }}
                        className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground min-h-[44px] touch-manipulation active:scale-95 transition-transform font-medium"
                      >
                        <ShoppingCart className="h-3 w-3 mr-1" />
                        Add to Cart
                      </Button>
                    </>
                  ) : isGuestView && onCopyToWishlist ? (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={handleCopyToWishlist}
                      className="text-xs"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  ) : (
                    <>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={handleViewDetails}
                        className="text-xs"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      {onGiftNow && (
                        <Button 
                          size="sm" 
                          onClick={handleGiftNow}
                          className="text-xs"
                        >
                          <Gift className="h-3 w-3 mr-1" />
                          Gift
                        </Button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Item from Wishlist</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{item.name || item.title}" from this wishlist? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              disabled={isRemoving}
              className="bg-destructive hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EnhancedWishlistCard;