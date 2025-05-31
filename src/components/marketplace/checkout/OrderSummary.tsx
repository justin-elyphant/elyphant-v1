
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Product } from "@/types/product";
import { Separator } from "@/components/ui/separator";
import { ShoppingBag, Gift, Calendar } from "lucide-react";
import { GiftOptions } from "./useCheckoutState";
import { ShippingOption } from "@/components/marketplace/zinc/services/shippingQuoteService";
import TransparentPriceBreakdown from "./TransparentPriceBreakdown";

interface OrderSummaryProps {
  cartItems: {
    product: Product;
    quantity: number;
  }[];
  cartTotal: number;
  shippingCost: number;
  selectedShippingOption: ShippingOption | null;
  giftOptions: GiftOptions;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  cartItems,
  cartTotal,
  shippingCost,
  selectedShippingOption,
  giftOptions
}) => {
  // Calculate tax (8.25% for demonstration)
  const getTaxAmount = () => {
    return cartTotal * 0.0825;
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
        
        {/* Shipping Method Display */}
        {selectedShippingOption && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span>Shipping Method</span>
            </div>
            <div className="flex justify-between text-sm pl-6">
              <span className="text-muted-foreground">{selectedShippingOption.name}</span>
              <span>{selectedShippingOption.price === 0 ? "FREE" : `$${selectedShippingOption.price.toFixed(2)}`}</span>
            </div>
            <p className="text-xs text-muted-foreground pl-6">
              {selectedShippingOption.delivery_time}
            </p>
            <Separator />
          </div>
        )}
        
        {/* Gift Options Display */}
        {giftOptions.isGift && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Gift className="h-4 w-4 text-green-600" />
              <span>Gift Options</span>
            </div>
            {giftOptions.giftMessage && (
              <p className="text-xs text-muted-foreground pl-6">
                Message: "{giftOptions.giftMessage.substring(0, 50)}{giftOptions.giftMessage.length > 50 ? '...' : ''}"
              </p>
            )}
            {giftOptions.scheduledDeliveryDate && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground pl-6">
                <Calendar className="h-3 w-3" />
                <span>Scheduled: {new Date(giftOptions.scheduledDeliveryDate).toLocaleDateString()}</span>
              </div>
            )}
            {giftOptions.isSurpriseGift && (
              <p className="text-xs text-muted-foreground pl-6">
                Surprise gift (no confirmation emails)
              </p>
            )}
            <Separator />
          </div>
        )}
        
        {/* Transparent Price Breakdown with Real Shipping */}
        <TransparentPriceBreakdown
          basePrice={cartTotal}
          shippingCost={shippingCost}
        />

        {/* Tax */}
        <div className="flex justify-between text-sm">
          <span>Tax</span>
          <span>${getTaxAmount().toFixed(2)}</span>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0">
        <div className="w-full">
          <Separator className="my-2" />
          
          <div className="flex justify-between font-semibold text-lg">
            <span>Final Total</span>
            <span>${(cartTotal + shippingCost + getTaxAmount()).toFixed(2)}</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default OrderSummary;
