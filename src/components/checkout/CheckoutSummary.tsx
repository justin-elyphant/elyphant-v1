import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface CheckoutSummaryProps {
  cartItems: any[];
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  totalAmount: number;
}

const CheckoutSummary: React.FC<CheckoutSummaryProps> = ({
  cartItems,
  subtotal,
  shippingCost,
  taxAmount,
  totalAmount
}) => {
  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {cartItems.map((item) => (
            <div key={item.product.product_id} className="flex justify-between text-sm">
              <span className="flex-1 truncate">{item.product.name} × {item.quantity}</span>
              <span>${(item.product.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        
        <Separator />
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>${shippingCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax</span>
            <span>${taxAmount.toFixed(2)}</span>
          </div>
        </div>
        
        <Separator />
        
        <div className="flex justify-between font-bold">
          <span>Total</span>
          <span>${totalAmount.toFixed(2)}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default CheckoutSummary;