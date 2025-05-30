
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Product } from "@/types/product";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Gift } from "lucide-react";
import TransparentPriceBreakdown from "./TransparentPriceBreakdown";

interface OrderSummaryProps {
  cartItems: {
    product: Product;
    quantity: number;
  }[];
  cartTotal: number;
  shippingMethod: string;
  giftOptions: {
    isGift: boolean;
    giftWrapping: boolean;
  };
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  cartItems,
  cartTotal,
  shippingMethod,
  giftOptions
}) => {
  // Calculate shipping cost based on method
  const getShippingCost = () => {
    return shippingMethod === "express" ? 12.99 : 4.99;
  };
  
  // Calculate gift wrapping cost
  const getGiftWrappingCost = () => {
    return giftOptions.isGift && giftOptions.giftWrapping ? 4.99 : 0;
  };

  return (
    <Card className="sticky top-20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <ShoppingBag className="h-5 w-5 mr-2" />
          Order Summary
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="max-h-64 overflow-y-auto space-y-3 pb-1">
          {cartItems.map((item) => (
            <div key={item.product.id} className="flex items-center gap-3">
              <div className="w-12 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                {item.product.image && (
                  <img 
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              
              <div className="flex-grow overflow-hidden">
                <p className="font-medium text-sm truncate">{item.product.name}</p>
                <p className="text-xs text-muted-foreground">
                  Qty: {item.quantity}
                </p>
              </div>
              
              <div className="text-right">
                <p className="font-medium">${(item.product.price * item.quantity).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
        
        <Separator />
        
        {/* Transparent Price Breakdown */}
        <TransparentPriceBreakdown
          basePrice={cartTotal}
          shippingCost={getShippingCost()}
        />

        {/* Gift Wrapping Fee (separate from transparent pricing for now) */}
        {giftOptions.isGift && giftOptions.giftWrapping && (
          <>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="flex items-center">
                Gift Wrapping
                <Gift className="h-3 w-3 ml-1" />
              </span>
              <span>${getGiftWrappingCost().toFixed(2)}</span>
            </div>
          </>
        )}
        
        {giftOptions.isGift && (
          <div className="flex items-center">
            <Badge variant="outline" className="bg-pink-50 text-pink-800 border-pink-200 text-xs px-1.5 py-0">
              <Gift className="h-3 w-3 mr-1" /> Gift
            </Badge>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-0">
        <div className="w-full">
          <Separator className="my-2" />
          
          <div className="flex justify-between font-semibold text-lg">
            <span>Final Total</span>
            <span>${(cartTotal + getShippingCost() + getGiftWrappingCost()).toFixed(2)}</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default OrderSummary;
