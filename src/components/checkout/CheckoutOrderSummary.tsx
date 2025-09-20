
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ShoppingBag } from 'lucide-react';
import { CartItem } from '@/contexts/CartContext';
import ContextualHelp from '@/components/help/ContextualHelp';
import { getPrimaryProductImage } from '@/components/marketplace/product-item/getPrimaryProductImage';

interface CheckoutOrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  shippingCost: number;
  giftingFee: number;
  giftingFeeName?: string;
  giftingFeeDescription?: string;
  taxAmount: number;
  totalAmount: number;
}

const CheckoutOrderSummary: React.FC<CheckoutOrderSummaryProps> = ({
  items,
  subtotal,
  shippingCost,
  giftingFee,
  giftingFeeName = 'Gifting Fee',
  giftingFeeDescription = '',
  taxAmount,
  totalAmount
}) => {
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
    <Card className="mobile-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" />
          Order Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Items */}
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.product.id} className="flex items-center gap-3 mobile-card">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                <img 
                  src={getPrimaryProductImage(item.product)}
                  alt={item.product.name || item.product.title || 'Product'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg";
                  }}
                />
              </div>
              <div className="flex-grow min-w-0">
                <p className="font-medium text-sm mobile-truncate">{item.product.name}</p>
                {item.variationText && (
                  <p className="text-xs text-muted-foreground">{item.variationText}</p>
                )}
                <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">${(item.product.price * item.quantity).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Price breakdown */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Shipping</span>
            <span>${shippingCost.toFixed(2)}</span>
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
                          <li>Premium customer support</li>
                        </ul>
                      </div>
                    </div>
                  }
                />
              </span>
              <span>${giftingFee.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span>Tax</span>
            <span>${taxAmount.toFixed(2)}</span>
          </div>
        </div>

        <Separator />

        <div className="flex justify-between font-semibold text-lg">
          <span>Total</span>
          <span>${totalAmount.toFixed(2)}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default CheckoutOrderSummary;
