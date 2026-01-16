import React, { useState } from "react";
import { ShoppingCart, Gift, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface GiftActionHeaderProps {
  ownerName: string;
  itemCount: number;
  totalPrice: number;
  purchasedCount: number;
  onAddAllToCart: () => void;
  isAdding?: boolean;
}

const GiftActionHeader: React.FC<GiftActionHeaderProps> = ({
  ownerName,
  itemCount,
  totalPrice,
  purchasedCount,
  onAddAllToCart,
  isAdding = false,
}) => {
  const isMobile = useIsMobile();
  const availableCount = itemCount - purchasedCount;
  
  // Format price
  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(totalPrice);

  if (availableCount === 0) {
    return (
      <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <div>
            <p className="font-medium text-green-800 dark:text-green-200">
              All items have been purchased!
            </p>
            <p className="text-sm text-green-600 dark:text-green-400">
              {ownerName}'s wishlist is complete
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-muted/50 border border-border rounded-lg p-4 mb-6",
      isMobile ? "flex flex-col gap-3" : "flex justify-between items-center"
    )}>
      <div>
        <p className="font-medium flex items-center gap-2">
          <Gift className="h-4 w-4 text-primary" />
          Gift {ownerName} from this wishlist
        </p>
        <p className="text-sm text-muted-foreground">
          {availableCount} item{availableCount !== 1 ? "s" : ""} available
          {purchasedCount > 0 && (
            <span className="ml-2 text-green-600">
              • {purchasedCount} already purchased
            </span>
          )}
          <span className="mx-2">•</span>
          {formattedPrice} total
        </p>
      </div>
      
      <Button
        onClick={onAddAllToCart}
        disabled={isAdding}
        className={cn(
          "bg-red-600 hover:bg-red-700 text-white",
          isMobile && "w-full"
        )}
      >
        <ShoppingCart className="h-4 w-4 mr-2" />
        {isAdding ? "Adding..." : "Add All to Cart"}
      </Button>
    </div>
  );
};

export default GiftActionHeader;
