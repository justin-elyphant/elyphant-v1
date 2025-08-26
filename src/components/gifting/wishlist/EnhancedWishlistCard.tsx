import React, { useState } from "react";
import { Heart, ShoppingCart, Trash2, Gift, ExternalLink, Calendar, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatPriceWithDetection } from "@/utils/productSourceDetection";
import { WishlistItem } from "@/types/profile";

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
  className
}: EnhancedWishlistCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

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

  const handleSelectionChange = (checked: boolean) => {
    onSelectionChange?.(item.id, checked);
  };

  // Use database product_source for accurate pricing
  const formattedPrice = formatPriceWithDetection({
    price: item.price,
    image_url: item.image_url,
    productSource: (item as any).product_source,
    vendor: (item as any).vendor,
    retailer: (item as any).retailer,
    isZincApiProduct: (item as any).isZincApiProduct,
    skipCentsDetection: (item as any).skipCentsDetection
  });

  return (
    <>
      <Card className={`group relative overflow-hidden hover:shadow-lg transition-all duration-200 border-border/50 hover:border-primary/20 ${
        isSelected ? 'ring-2 ring-primary border-primary' : ''
      } ${className || ''}`}>
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
        
        {/* Product source badge */}
        {(item as any).product_source === 'zinc_api' && !isSelectionMode && (
          <div className="absolute top-3 left-3 z-10">
            <Badge variant="secondary" className="text-xs bg-background/90 backdrop-blur-sm">
              Amazon
            </Badge>
          </div>
        )}

        <CardContent className="p-0">
          {/* Image */}
          <div className="aspect-square bg-muted overflow-hidden cursor-pointer" onClick={() => !isSelectionMode && setShowDetails(true)}>
            <img 
              src={item.image_url || "/placeholder.svg"} 
              alt={item.name || item.title || "Product"}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
            {isSelected && (
              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                <div className="bg-primary text-primary-foreground rounded-full p-2">
                  <Check className="h-6 w-6" />
                </div>
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="p-4">
            <p className="text-sm text-muted-foreground mb-1">{item.brand || "Unknown Brand"}</p>
            <h3 className="font-medium mb-2 line-clamp-2 leading-tight">
              {item.name || item.title || "Unknown Item"}
            </h3>
            
            <div className="flex justify-between items-center">
              <p className="font-bold text-lg">{formattedPrice}</p>
              {!isSelectionMode && (
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setShowDetails(true)}
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
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{item.name || item.title || "Product Details"}</DialogTitle>
          </DialogHeader>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="aspect-square bg-muted rounded-lg overflow-hidden">
              <img 
                src={item.image_url || "/placeholder.svg"} 
                alt={item.name || item.title || "Product"}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">{item.brand || "Unknown Brand"}</p>
                <h2 className="text-xl font-semibold">{item.name || item.title || "Unknown Item"}</h2>
              </div>
              
              <div className="space-y-2">
                <p className="text-2xl font-bold">{formattedPrice}</p>
                {(item as any).product_source && (
                  <Badge variant="outline">
                    Source: {(item as any).product_source.replace('_', ' ').toUpperCase()}
                  </Badge>
                )}
              </div>
              
              <div className="flex gap-2 pt-4">
                {onGiftNow && (
                  <Button onClick={handleGiftNow} className="flex-1">
                    <Gift className="h-4 w-4 mr-2" />
                    Gift Now
                  </Button>
                )}
                {onScheduleGift && (
                  <Button onClick={handleScheduleGift} variant="outline" className="flex-1">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Gift
                  </Button>
                )}
                <Button variant="outline" className="flex-1">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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