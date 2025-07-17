import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Shield, Truck, Clock, CheckCircle } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { usePricingSettings } from '@/hooks/usePricingSettings';
import ContextualHelp from '@/components/help/ContextualHelp';

interface ModernOrderSummaryProps {
  shippingCost?: number;
  taxAmount?: number;
  estimatedDelivery?: string;
  shippingMethod?: string;
  showPriceLock?: boolean;
  onProceedToPayment?: () => void;
  onCompleteOrder?: () => void;
  currentStep?: 'review' | 'shipping' | 'payment';
  isValid?: boolean;
}

const ModernOrderSummary: React.FC<ModernOrderSummaryProps> = ({
  shippingCost = 0,
  taxAmount = 0,
  estimatedDelivery,
  shippingMethod,
  showPriceLock = true,
  onProceedToPayment,
  onCompleteOrder,
  currentStep = 'review',
  isValid = true
}) => {
  const { cartItems, cartTotal } = useCart();
  const { calculatePriceBreakdown } = usePricingSettings();
  
  const breakdown = calculatePriceBreakdown(cartTotal, shippingCost);
  const finalTotal = breakdown.total + taxAmount;

  return (
    <Card className="sticky top-6 h-fit">
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
              <div className="flex gap-3 flex-1">
                <div className="w-12 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                  {item.product.image && (
                    <img 
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm line-clamp-2">
                    {item.product.name || item.product.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Qty: {item.quantity} × ${item.product.price.toFixed(2)}
                  </p>
                </div>
              </div>
              <p className="font-medium text-sm">
                ${(item.product.price * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}
        </div>

        <Separator />

        {/* Pricing Breakdown */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Product Total ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
            <span>${breakdown.basePrice.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-1">
              <Truck className="h-3 w-3" />
              Shipping
              {shippingMethod && (
                <span className="text-muted-foreground">({shippingMethod})</span>
              )}
            </span>
            <span>{breakdown.shippingCost === 0 ? 'FREE' : `$${breakdown.shippingCost.toFixed(2)}`}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-1">
              {breakdown.giftingFeeName}
              <ContextualHelp
                id="gifting-fee-checkout"
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
                      <ul className="list-disc list-inside space-y-1 text-xs">
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

        {/* Action Buttons */}
        <div className="space-y-2">
          {currentStep === 'review' && onProceedToPayment && (
            <Button 
              onClick={onProceedToPayment}
              className="w-full"
              disabled={!isValid}
            >
              Proceed to Payment
            </Button>
          )}
          
          {currentStep === 'payment' && onCompleteOrder && (
            <Button 
              onClick={onCompleteOrder}
              className="w-full"
              disabled={!isValid}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete Order
            </Button>
          )}
        </div>

        {/* Security Notice */}
        <div className="text-xs text-muted-foreground text-center">
          <Shield className="h-3 w-3 inline mr-1" />
          Secure checkout with SSL encryption
        </div>
      </CardContent>
    </Card>
  );
};

export default ModernOrderSummary;