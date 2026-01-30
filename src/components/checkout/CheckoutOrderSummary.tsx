
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ShoppingBag, Check } from 'lucide-react';
import { CartItem } from '@/contexts/CartContext';
import ContextualHelp from '@/components/help/ContextualHelp';
import CartItemImage from '@/components/cart/CartItemImage';
import { formatPrice } from '@/lib/utils';

interface CheckoutOrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  shippingCost: number | null;
  giftingFee: number;
  giftingFeeName?: string;
  giftingFeeDescription?: string;
  taxAmount: number;
  totalAmount: number;
  isLoadingShipping?: boolean;
}

const CheckoutOrderSummary: React.FC<CheckoutOrderSummaryProps> = ({
  items,
  subtotal,
  shippingCost,
  giftingFee,
  giftingFeeName = 'Gifting Fee',
  giftingFeeDescription = '',
  taxAmount,
  totalAmount,
  isLoadingShipping = false
}) => {
  const isFreeShipping = shippingCost === 0;
  
  // 🛡️ DEVELOPMENT SAFEGUARDS - Remove in production
  if (process.env.NODE_ENV === 'development') {
    if (giftingFee > 0 && giftingFeeName === 'Gifting Fee') {
      console.warn('⚠️ ORDER SUMMARY: Using default fee name instead of dynamic pricing settings');
    }
    if (giftingFee > 0 && !giftingFeeDescription) {
      console.warn('⚠️ ORDER SUMMARY: Missing fee description - check pricing_settings integration');
    }
  }
  return (
    <Card className="w-full lg:sticky lg:top-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Order Summary</span>
          <span className="text-sm font-normal text-muted-foreground">{items.length} item{items.length !== 1 ? 's' : ''}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Items */}
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.product.id} className="flex items-center gap-3 w-full">
              <CartItemImage item={item} size="sm" className="flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm break-words line-clamp-2">{item.product.name}</p>
                {item.variationText && (
                  <p className="text-xs text-muted-foreground break-words">{item.variationText}</p>
                )}
                <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-medium">{formatPrice(item.product.price * item.quantity)}</p>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Price breakdown */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm items-center">
            <span>Shipping</span>
            {isLoadingShipping || shippingCost === null ? (
              <span className="text-muted-foreground">Calculating...</span>
            ) : isFreeShipping ? (
              <span className="flex items-center gap-1 text-primary font-medium">
                <Check className="h-4 w-4" />
                Free Delivery
              </span>
            ) : (
              <span>{formatPrice(shippingCost)}</span>
            )}
          </div>
          {giftingFee > 0 && (
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1">
                {giftingFeeName}
                <ContextualHelp
                  id="gifting-fee-checkout-summary"
                  title={`About Our ${giftingFeeName}`}
                  content={
                    <div className="space-y-2">
                      <p>
                        {giftingFeeDescription || 
                          "This fee supports system enhancements, AI-powered features, and automation that make gifting seamless and delightful."
                        }
                      </p>
                      <div className="space-y-1">
                        <p className="font-medium">What's included:</p>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                          <li>AI-powered gift recommendations</li>
                          <li>Automated gifting workflows</li>
                          <li>Enhanced tracking and notifications</li>
                        </ul>
                      </div>
                    </div>
                  }
                />
              </span>
              <span>{formatPrice(giftingFee)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span>Tax</span>
            <span>{formatPrice(taxAmount)}</span>
          </div>
        </div>

        <Separator />

        <div className="flex justify-between font-semibold text-lg">
          <span>Total</span>
          <span>{formatPrice(totalAmount)}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default CheckoutOrderSummary;
