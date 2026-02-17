import React from "react";
import { Gift, Calendar, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WishlistItem } from "@/types/profile";
import { formatPrice } from "@/lib/utils";

interface BulkActionBarProps {
  selectedItems: WishlistItem[];
  onClearSelection: () => void;
  onBulkGift: (items: WishlistItem[]) => void;
  onBulkSchedule: (items: WishlistItem[]) => void;
  onBulkRemove: (items: WishlistItem[]) => void;
}

const BulkActionBar = ({
  selectedItems,
  onClearSelection,
  onBulkGift,
  onBulkSchedule,
  onBulkRemove
}: BulkActionBarProps) => {
  if (selectedItems.length === 0) return null;

  const totalValue = selectedItems.reduce((sum, item) => {
    return sum + (Number(item.price) || 0);
  }, 0);

  return (
    <Card className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 shadow-lg border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4 min-w-[300px]">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="px-3 py-1">
              {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
            </Badge>
            <span className="text-sm text-muted-foreground">
              ~{formatPrice(totalValue)} total
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkGift(selectedItems)}
              className="text-xs"
            >
              <Gift className="h-3 w-3 mr-1" />
              Gift All
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkSchedule(selectedItems)}
              className="text-xs"
            >
              <Calendar className="h-3 w-3 mr-1" />
              Schedule
            </Button>
            
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onBulkRemove(selectedItems)}
              className="text-xs"
            >
              Remove
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="h-8 w-8 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BulkActionBar;