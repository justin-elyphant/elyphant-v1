
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Shield, Truck, Clock } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

interface CheckoutSummaryProps {
  shippingCost?: number;
  taxAmount?: number;
  estimatedDelivery?: string;
  shippingMethod?: string;
  showPriceLock?: boolean;
}

const CheckoutSummary: React.FC<CheckoutSummaryProps> = ({
  shippingCost = 0,
  taxAmount = 0,
  estimatedDelivery,
  shippingMethod,
  showPriceLock = true
}) => {
  const { cartItems, cartTotal } = useCart();

  const finalTotal = cartTotal + shippingCost + taxAmount;

  return (
    <Card className="sticky top-4 h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShoppingCart className="h-5 w-5" />
          Order Summary
        </CardTitle>
        {showPriceLock && (
          <Badge variant="secondary" className="w-fit">
            <Shield className="h-3 w-3 mr-1" />
            Price locked for 15 minutes
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cart Items */}
        <div className="space-y-3">
          {cartItems.map((item) => (
            <div key={item.product.product_id} className="flex justify-between items-start">
              <div className="flex-1">
                <p className="font-medium text-sm line-clamp-2">
                  {item.product.name || item.product.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  Qty: {item.quantity} × ${item.product.price.toFixed(2)}
                </p>
              </div>
              <p className="font-medium text-sm">
                ${(item.product.price * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}
        </div>

        <Separator />

        {/* Cost Breakdown */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
            <span>${cartTotal.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-1">
              <Truck className="h-3 w-3" />
              Shipping
              {shippingMethod && (
                <span className="text-muted-foreground">({shippingMethod})</span>
              )}
            </span>
            <span>{shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span>Estimated Tax</span>
            <span>${taxAmount.toFixed(2)}</span>
          </div>
        </div>

        <Separator />

        {/* Total */}
        <div className="flex justify-between items-center font-bold text-lg">
          <span>Total</span>
          <span>${finalTotal.toFixed(2)}</span>
        </div>

        {/* Delivery Info */}
        {estimatedDelivery && (
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-green-600" />
              <span className="font-medium">Estimated Delivery</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {estimatedDelivery}
            </p>
          </div>
        )}

        {/* Security Notice */}
        <div className="text-xs text-muted-foreground text-center">
          <Shield className="h-3 w-3 inline mr-1" />
          Secure checkout with SSL encryption
        </div>
      </CardContent>
    </Card>
  );
};

export default CheckoutSummary;
