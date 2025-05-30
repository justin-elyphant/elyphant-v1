
import React, { useState } from "react";
import { Info } from "lucide-react";
import { usePricingSettings } from "@/hooks/usePricingSettings";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface TransparentPriceBreakdownProps {
  basePrice: number;
  shippingCost?: number;
  className?: string;
}

const TransparentPriceBreakdown = ({ 
  basePrice, 
  shippingCost = 0, 
  className = "" 
}: TransparentPriceBreakdownProps) => {
  const { calculatePriceBreakdown } = usePricingSettings();
  const [showFeeInfo, setShowFeeInfo] = useState(false);
  
  const breakdown = calculatePriceBreakdown(basePrice, shippingCost);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between text-sm">
        <span>Product Cost</span>
        <span>${breakdown.basePrice.toFixed(2)}</span>
      </div>
      
      {breakdown.shippingCost > 0 && (
        <div className="flex justify-between text-sm">
          <span>Shipping</span>
          <span>${breakdown.shippingCost.toFixed(2)}</span>
        </div>
      )}
      
      <div className="flex justify-between text-sm">
        <span className="flex items-center gap-1">
          {breakdown.giftingFeeName}
          <Dialog open={showFeeInfo} onOpenChange={setShowFeeInfo}>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-4 w-4 p-0 hover:bg-transparent"
              >
                <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>About Our {breakdown.giftingFeeName}</DialogTitle>
                <DialogDescription className="pt-4">
                  {breakdown.giftingFeeDescription || 
                    "This fee helps us maintain our platform and provide you with the best gifting experience."
                  }
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 text-sm">
                <p><strong>What's included:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Platform technology and maintenance</li>
                  <li>Customer support and gift tracking</li>
                  <li>Curated shopping experience</li>
                  <li>Secure payment processing</li>
                  <li>Gift delivery coordination</li>
                </ul>
              </div>
            </DialogContent>
          </Dialog>
        </span>
        <span>${breakdown.giftingFee.toFixed(2)}</span>
      </div>
      
      <hr className="border-t border-muted" />
      
      <div className="flex justify-between font-medium">
        <span>Total</span>
        <span>${breakdown.total.toFixed(2)}</span>
      </div>
    </div>
  );
};

export default TransparentPriceBreakdown;
