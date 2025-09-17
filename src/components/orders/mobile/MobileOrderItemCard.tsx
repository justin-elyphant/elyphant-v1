import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCcw, Star } from "lucide-react";

interface MobileOrderItemCardProps {
  item: any;
  orderStatus: string;
  onReorder?: (item: any) => void;
  onReview?: (item: any) => void;
}

const MobileOrderItemCard = ({ 
  item, 
  orderStatus, 
  onReorder, 
  onReview 
}: MobileOrderItemCardProps) => {
  const [imageError, setImageError] = useState(false);
  
  const productName = (item as any).product_name || item.name || "Product";
  const brand = (item as any).brand;
  const unitPrice = (item as any).unit_price || item.price || 0;
  const totalPrice = unitPrice * item.quantity;
  
  // Enhanced image URL detection with more fallback options
  const imageUrl = (item as any).product_image || 
                   (item as any).image_url || 
                   (item as any).image || 
                   (item as any).images?.[0] ||
                   (item as any).product?.image ||
                   (item as any).product?.images?.[0];

  return (
    <Card className="mobile-card-hover">
      <CardContent className="touch-padding">
        <div className="flex gap-4">
          {/* Product Image */}
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden relative">
              {imageUrl && !imageError ? (
                <img 
                  src={imageUrl} 
                  alt={productName}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                  onLoad={() => setImageError(false)}
                />
              ) : (
                <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center">
                  <span className="text-sm text-primary font-medium">
                    {productName.charAt(0)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Product Details */}
          <div className="flex-1 min-w-0">
            <div className="space-y-1">
              <h3 className="font-medium text-body-base leading-tight line-clamp-2">
                {productName}
              </h3>
              {brand && (
                <p className="text-body-sm text-muted-foreground">
                  {brand}
                </p>
              )}
              <div className="flex items-center gap-4 text-body-sm text-muted-foreground">
                <span>Qty: {item.quantity}</span>
                <span>•</span>
                <span>${unitPrice.toFixed(2)} each</span>
              </div>
            </div>
          </div>

          {/* Price and Actions */}
          <div className="flex-shrink-0 text-right space-y-3">
            <div className="font-semibold text-body-base">
              ${totalPrice.toFixed(2)}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReorder?.(item)}
                className="touch-target-44 h-9 w-9 p-0"
                aria-label="Reorder item"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              
              {orderStatus === "delivered" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onReview?.(item)}
                  className="touch-target-44 h-9 w-9 p-0"
                  aria-label="Review item"
                >
                  <Star className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MobileOrderItemCard;