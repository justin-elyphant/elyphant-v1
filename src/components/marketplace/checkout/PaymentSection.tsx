
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { CartItem } from "@/contexts/CartContext";
import PaymentForm from "./PaymentForm";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import { invokeWithAuthRetry } from "@/utils/supabaseWithAuthRetry";

interface PaymentSectionProps {
  paymentMethod: string;
  onPaymentMethodChange: (method: string) => void;
  onPlaceOrder: (paymentIntentId?: string) => void;
  isProcessing: boolean;
  canPlaceOrder: boolean;
  onPrevious: () => void;
  totalAmount: number;
  cartItems: CartItem[];
  shippingInfo?: any;
  giftOptions?: any;
  // CRITICAL: Pricing breakdown for webhook order creation
  pricingBreakdown: {
    subtotal: number;
    shippingCost: number;
    giftingFee: number;
    giftingFeeName: string;
    giftingFeeDescription: string;
    taxAmount: number;
  };
}

const PaymentSection = ({
  paymentMethod,
  onPaymentMethodChange,
  onPlaceOrder,
  isProcessing,
  canPlaceOrder,
  onPrevious,
  totalAmount,
  cartItems,
  shippingInfo,
  giftOptions,
  pricingBreakdown
}: PaymentSectionProps) => {
  const { user } = useAuth();
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);

  // Build delivery groups from cart items
  const buildDeliveryGroups = () => {
    const groups: Record<string, any> = {};
    
    cartItems.forEach(item => {
      const recipientId = item.recipientAssignment?.connectionId || 'default';
      if (!groups[recipientId]) {
        groups[recipientId] = {
          recipient_id: recipientId,
          recipient_name: item.recipientAssignment?.connectionName || 'Self',
          shipping_address: item.recipientAssignment?.shippingAddress || shippingInfo,
          items: []
        };
      }
      groups[recipientId].items.push({
        product_id: item.product.product_id || item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        image_url: item.product.image || item.product.images?.[0]
      });
    });
    
    return Object.values(groups);
  };

  const handleContinueToCheckout = async () => {
    if (!canPlaceOrder || isProcessing) return;

    setIsCreatingCheckout(true);
    toast.loading('Creating checkout session...', { id: 'checkout-session' });

    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const deliveryGroups = buildDeliveryGroups();

      console.log('🛒 Creating checkout session with:', {
        itemCount: cartItems.length,
        totalAmount,
        deliveryGroupCount: deliveryGroups.length
      });

      const { data, error } = await invokeWithAuthRetry('create-checkout-session', {
        body: {
          cartItems: cartItems.map(item => ({
            product_id: item.product.product_id || item.product.id,
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
            image_url: item.product.image || item.product.images?.[0],
            recipientAssignment: item.recipientAssignment
          })),
          deliveryGroups,
          shippingInfo,
          giftOptions,
          pricingBreakdown,
          metadata: {
            order_type: 'marketplace',
            user_id: currentUser.id
          }
        }
      });

      if (error) throw error;

      if (data?.url) {
        console.log('✅ Checkout session created, redirecting to Stripe...');
        toast.success('Redirecting to checkout...', { id: 'checkout-session' });
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('❌ Error creating checkout session:', error);
      toast.error(error.message || 'Failed to create checkout session', { id: 'checkout-session' });
      setIsCreatingCheckout(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Method</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Method Selection */}
        <PaymentForm
          paymentMethod={paymentMethod}
          onMethodChange={onPaymentMethodChange}
        />

        {/* Continue to Checkout Button */}
        {paymentMethod === 'card' && (
          <div className="space-y-4">
            <Button
              onClick={handleContinueToCheckout}
              disabled={!canPlaceOrder || isProcessing || isCreatingCheckout}
              className="w-full"
              size="lg"
            >
              {isCreatingCheckout ? 'Creating checkout...' : 'Continue to Checkout'}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              You'll be redirected to our secure payment page
            </p>
          </div>
        )}

        {/* PayPal - Show message */}
        {paymentMethod === 'paypal' && (
          <div className="space-y-4">
            <Button
              onClick={handleContinueToCheckout}
              disabled={!canPlaceOrder || isProcessing || isCreatingCheckout}
              className="w-full"
              size="lg"
            >
              {isCreatingCheckout ? 'Creating checkout...' : 'Continue with PayPal'}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              You'll be redirected to PayPal to complete your payment
            </p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="pt-4">
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={isProcessing || isCreatingCheckout}
            className="w-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shipping
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentSection;
