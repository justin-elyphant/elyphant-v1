
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { formatPriceWithDetection } from "@/utils/productSourceDetection";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface GiftItemCardProps {
  name: string;
  price: number;
  brand: string;
  imageUrl: string;
  mini?: boolean;
  className?: string;
  onRemove?: () => void;
  isRemoving?: boolean;
  // Additional props for product source detection
  vendor?: string;
  retailer?: string;
  productSource?: string;
  isZincApiProduct?: boolean;
  skipCentsDetection?: boolean;
}

const GiftItemCard = ({ 
  name, 
  price, 
  brand, 
  imageUrl, 
  mini = false,
  className,
  onRemove,
  isRemoving = false,
  vendor,
  retailer,
  productSource,
  isZincApiProduct,
  skipCentsDetection
}: GiftItemCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    onRemove?.();
    setShowDeleteDialog(false);
  };

  // Use intelligent pricing with source detection
  const formattedPrice = formatPriceWithDetection({
    price,
    image_url: imageUrl,
    vendor,
    retailer,
    productSource,
    isZincApiProduct,
    skipCentsDetection
  });

  if (mini) {
    return (
      <div 
        className={cn(
          "group relative border rounded-md overflow-hidden hover:border-primary transition-colors",
          className
        )}
      >
        {onRemove && (
          <div className="absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button 
              variant="destructive" 
              size="icon" 
              className="h-6 w-6"
              onClick={handleDeleteClick}
              disabled={isRemoving}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
        <div className="aspect-square bg-gray-100">
          <img 
            src={imageUrl} 
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-2 text-xs">
          <p className="font-medium line-clamp-1">{name}</p>
          <p className="text-muted-foreground">{formattedPrice}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        className={cn(
          "group relative border rounded-md overflow-hidden hover:shadow-md transition-all",
          className
        )}
      >
        <div className="absolute top-2 right-2 z-10 flex gap-1">
          {onRemove && (
            <Button 
              variant="destructive" 
              size="icon" 
              className="h-8 w-8 rounded-full bg-red-500/90 backdrop-blur-sm opacity-80 hover:opacity-100 transition-opacity"
              onClick={handleDeleteClick}
              disabled={isRemoving}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm opacity-80 hover:opacity-100 transition-opacity">
            <Heart className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="aspect-square bg-gray-100">
          <img 
            src={imageUrl} 
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        </div>
        
        <div className="p-4">
          <p className="text-sm text-muted-foreground">{brand}</p>
          <h3 className="font-medium mb-2 line-clamp-2">{name}</h3>
          <div className="flex justify-between items-center">
            <p className="font-bold">{formattedPrice}</p>
            <Button size="sm" variant="secondary">
              <ShoppingCart className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Item from Wishlist</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{name}" from this wishlist? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              disabled={isRemoving}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default GiftItemCard;
