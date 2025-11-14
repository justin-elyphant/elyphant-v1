/*
 * ========================================================================
 * 🍎 APPLE PAY BUTTON - NATIVE MOBILE PAYMENT INTEGRATION
 * ========================================================================
 * 
 * Stripe Payment Request Button integration for Apple Pay on iOS Safari.
 * Provides native payment experience while integrating with unified systems.
 * 
 * CRITICAL INTEGRATION:
 * - Uses UnifiedPaymentService for processing
 * - Respects existing payment protection systems
 * - Falls back gracefully for non-compatible browsers
 * 
 * iOS OPTIMIZATION:
 * - Only shows on compatible iOS Safari browsers
 * - Provides native Apple Pay UI
 * - Handles payment processing through Stripe
 * 
 * Last update: 2025-01-23 (Portal Payment Implementation)
 * ========================================================================
 */

import React, { useEffect, useState } from 'react';
import { PaymentRequestButtonElement, useStripe } from '@stripe/react-stripe-js';
import { useAuth } from '@/contexts/auth';
import { CheckoutItem } from '@/types/checkout';
import { supabase } from '@/integrations/supabase/client';

interface ApplePayButtonProps {
  items: CheckoutItem[];
  totalAmount: number;
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
  disabled?: boolean;
}

const ApplePayButton: React.FC<ApplePayButtonProps> = ({
  items,
  totalAmount,
  onPaymentSuccess,
  onPaymentError,
  disabled = false
}) => {
  const stripe = useStripe();
  const { user } = useAuth();
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const [canMakePayment, setCanMakePayment] = useState(false);

  useEffect(() => {
    if (!stripe) return;

    // Only show on iOS Safari
    const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    if (!isIOSSafari) return;

    // Create payment request for Apple Pay
    const pr = stripe.paymentRequest({
      country: 'US',
      currency: 'usd',
      total: {
        label: 'Total',
        amount: Math.round(totalAmount * 100), // Convert to cents
      },
      displayItems: items.map(item => ({
        label: `${item.name} (x${item.quantity})`,
        amount: Math.round(item.price * item.quantity * 100),
      })),
      requestPayerName: true,
      requestPayerEmail: true,
    });

    // Check if Apple Pay is available
    pr.canMakePayment().then(result => {
      if (result) {
        setCanMakePayment(true);
        setPaymentRequest(pr);
      }
    });

    // Handle payment method creation
    pr.on('paymentmethod', async (event) => {
      try {
        console.log('🍎 Apple Pay payment method created:', event.paymentMethod.id);
        
        // Create checkout session for Apple Pay (payment mode, no redirect)
        // Note: Apple Pay uses PaymentRequest API, so we need payment intent flow
        const { data, error: functionError } = await supabase.functions.invoke('create-checkout-session', {
          body: {
            cartItems: items.map(item => ({
              product_id: item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              image_url: item.image
            })),
            metadata: {
              user_id: user?.id,
              order_type: 'marketplace_purchase',
              payment_method: 'apple_pay',
              payment_intent_only: true // Request payment intent instead of redirect
            }
          }
        });

        if (functionError) {
          throw new Error(functionError.message || 'Failed to create payment intent');
        }

        const { client_secret, payment_intent_id } = data;

        if (!client_secret) {
          throw new Error('Failed to create payment intent');
        }

        // Confirm payment with Apple Pay
        const { error: confirmError } = await stripe.confirmCardPayment(
          client_secret,
          { payment_method: event.paymentMethod.id },
          { handleActions: false }
        );

        if (confirmError) {
          event.complete('fail');
          onPaymentError(confirmError.message || 'Payment failed');
          return;
        }

        event.complete('success');
        onPaymentSuccess(payment_intent_id);
        
      } catch (error) {
        console.error('🍎 Apple Pay error:', error);
        event.complete('fail');
        onPaymentError(error instanceof Error ? error.message : 'Payment failed');
      }
    });

  }, [stripe, totalAmount, items, user, onPaymentSuccess, onPaymentError]);

  // Only render if Apple Pay is available and not disabled
  if (!canMakePayment || disabled || !paymentRequest) {
    return null;
  }

  return (
    <div className="apple-pay-button-container">
      <PaymentRequestButtonElement
        options={{
          paymentRequest,
          style: {
            paymentRequestButton: {
              type: 'buy',
              theme: 'dark',
              height: '48px',
            },
          },
        }}
      />
    </div>
  );
};

export default ApplePayButton;