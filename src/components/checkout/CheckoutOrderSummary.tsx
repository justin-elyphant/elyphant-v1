
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ShoppingBag } from 'lucide-react';
import { CartItem } from '@/contexts/CartContext';
import ContextualHelp from '@/components/help/ContextualHelp';

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
  return (
    <Card>
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
              <div className="flex-grow">
                <p className="font-medium text-sm">{item.product.name}</p>
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
