
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CartItem } from "@/contexts/CartContext";
import { ShippingInfo } from "./useCheckoutState";
import { GiftOptions } from "@/types/gift-options";

interface ExpressCheckoutButtonProps {
  cartItems: CartItem[];
  totalAmount: number;
  shippingInfo: ShippingInfo;
  giftOptions: GiftOptions;
  onProcessing: (processing: boolean) => void;
  onSuccess: () => void;
}

const ExpressCheckoutButton = ({
  cartItems,
  totalAmount,
  shippingInfo,
  giftOptions,
  onProcessing,
  onSuccess
}: ExpressCheckoutButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleExpressCheckout = async () => {
    setIsLoading(true);
    onProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          cartItems,
          totalAmount,
          shippingInfo,
          giftOptions,
          metadata: {
            checkout_type: 'express'
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Express checkout error:', error);
      toast.error('Failed to create checkout session. Please try again.');
    } finally {
      setIsLoading(false);
      onProcessing(false);
    }
  };

  return (
    <Button
      onClick={handleExpressCheckout}
      disabled={isLoading || cartItems.length === 0}
      className="w-full bg-blue-600 hover:bg-blue-700"
      size="lg"
    >
      {isLoading ? 'Creating checkout...' : 'Express Checkout'}
    </Button>
  );
};

export default ExpressCheckoutButton;
