
import React, { useState } from "react";
import { Check } from "lucide-react";
import { usePricingSettings } from "@/hooks/usePricingSettings";
import ContextualHelp from "@/components/help/ContextualHelp";

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
  
  const breakdown = calculatePriceBreakdown(basePrice, shippingCost);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between text-sm">
        <span>Product Cost</span>
        <span>${breakdown.basePrice.toFixed(2)}</span>
      </div>
      
      <div className="flex justify-between text-sm">
        <span>Shipping</span>
        {breakdown.shippingCost === 0 ? (
          <span className="flex items-center gap-1 text-primary font-medium">
            <Check className="h-4 w-4" />
            Free Delivery
          </span>
        ) : (
          <span>${breakdown.shippingCost.toFixed(2)}</span>
        )}
      </div>
      
      <div className="flex justify-between text-sm">
        <span className="flex items-center gap-1">
          {breakdown.giftingFeeName}
          <ContextualHelp
            id="gifting-fee"
            title={`About Our ${breakdown.giftingFeeName}`}
            content={
              <div className="space-y-2">
                <p>
                  {breakdown.giftingFeeDescription || 
                    "This fee supports system enhancements, AI-powered features, and automation that make gifting seamless and delightful."
                  }
                </p>
                <div className="space-y-1">
                  <p className="font-medium">What's included:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                    <li>Platform technology and maintenance</li>
                    <li>Customer support and gift tracking</li>
                    <li>Curated shopping experience</li>
                    <li>Secure payment processing</li>
                    <li>Gift delivery coordination</li>
                    <li>AI-powered gift recommendations and search</li>
                    <li>Automated gifting features and scheduling</li>
                    <li>Smart wishlist management and sharing</li>
                  </ul>
                </div>
              </div>
            }
            iconSize={12}
            className="text-muted-foreground hover:text-foreground"
          />
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
