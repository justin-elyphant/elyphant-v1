
/*
 * ========================================================================
 * 🎯 PAYMENT METHOD SELECTOR - PHASE 3 UNIFIED INTEGRATION
 * ========================================================================
 * 
 * MIGRATION COMPLETED - Phase 3:
 * ✅ Updated to use UnifiedPaymentForm instead of StripePaymentForm
 * ✅ Integrated with UnifiedPaymentMethodManager for consistent UX
 * ✅ Preserved all existing functionality and protection measures
 * ✅ Enhanced error handling and user experience
 * 
 * INTEGRATION WITH PROTECTION MEASURES:
 * - Uses StripeClientManager for centralized Stripe client management
 * - Integrates with UnifiedPaymentService for payment processing
 * - Respects existing rate limiting and circuit breaker patterns
 * - Maintains audit trail and error logging
 * 
 * 🔗 DEPENDENCIES:
 * - UnifiedPaymentService: Centralized payment orchestration
 * - UnifiedPaymentForm: Consolidated payment form component
 * - UnifiedPaymentMethodManager: Payment method management
 * - SavedPaymentMethodsSection: Legacy compatibility wrapper
 * 
 * Phase 3 Implementation - 2025-01-24
 * ========================================================================
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Elements } from '@stripe/react-stripe-js';
import { stripeClientManager } from '@/services/payment/StripeClientManager';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/auth';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import SavedPaymentMethodsSection from './SavedPaymentMethodsSection';
import UnifiedPaymentForm from '@/components/payments/UnifiedPaymentForm';
import ApplePayButton from '@/components/payments/ApplePayButton';

// CRITICAL: Payment method interface
interface PaymentMethod {
  id: string;
  stripe_payment_method_id: string;
  card_type: string;
  last_four: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
}

// CRITICAL: Component props interface
interface PaymentMethodSelectorProps {
  clientSecret: string;
  totalAmount: number;
  onPaymentSuccess: (paymentIntentId: string, paymentMethodId?: string) => void;
  onPaymentError: (error: string) => void;
  isProcessingPayment: boolean;
  onProcessingChange: (processing: boolean) => void;
  refreshKey: number;
  onRefreshKeyChange: (key: number) => void;
  shippingAddress?: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

/*
 * 🎯 PAYMENT METHOD SELECTOR COMPONENT
 * 
 * This component provides a comprehensive payment method selection interface
 * with support for both saved and new payment methods.
 * 
 * CRITICAL: Handles complex payment flows with Stripe integration
 */
const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  clientSecret,
  totalAmount,
  onPaymentSuccess,
  onPaymentError,
  isProcessingPayment,
  onProcessingChange,
  refreshKey,
  onRefreshKeyChange,
  shippingAddress
}) => {
  const { user } = useAuth();
  const [selectedSavedMethod, setSelectedSavedMethod] = useState<PaymentMethod | null>(null);
  const [showNewCardForm, setShowNewCardForm] = useState(false);
  const [saveNewCard, setSaveNewCard] = useState(false);
  const payCardRef = useRef<HTMLDivElement | null>(null);
  const isMobile = useIsMobile();

  // Portal management for mobile CTA
  useEffect(() => {
    const shouldShowPortalCTA = isMobile && selectedSavedMethod;
    
    if (shouldShowPortalCTA) {
      console.log('🚀 Activating portal CTA and hiding bottom nav');
      document.body.classList.add('bottom-sheet-open');
    } else {
      console.log('🔄 Deactivating portal CTA and restoring bottom nav');
      document.body.classList.remove('bottom-sheet-open');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('bottom-sheet-open');
    };
  }, [isMobile, selectedSavedMethod]);

  /*
   * 🔗 CRITICAL: Payment method selection handler
   * 
   * This function manages the selection between saved and new payment methods
   */
  const handleSelectPaymentMethod = (method: PaymentMethod | null) => {
    setSelectedSavedMethod(method);
    setShowNewCardForm(!method);
    // Ensure the pay button/card is visible above the bottom nav on mobile/tablet
    if (method) {
      setTimeout(() => {
        try {
          const el = payCardRef.current;
          if (!el) return;

          // Find the primary scroll container used in SidebarLayout
          const container = (el.closest('.ios-scroll') as HTMLElement) 
            || (document.querySelector('main.ios-scroll') as HTMLElement)
            || (document.scrollingElement as HTMLElement | null);

          const elRect = el.getBoundingClientRect();
          const containerRect = container
            ? container.getBoundingClientRect()
            : ({ top: 0, bottom: window.innerHeight } as DOMRect);

          const rootStyle = getComputedStyle(document.documentElement);
          const navVar = rootStyle.getPropertyValue('--bottom-nav-height').trim();
          const navHeight = parseInt(navVar || '64', 10) || 64;
          const extra = 48; // breathing room
          const safeBottom = containerRect.bottom - (navHeight + extra);

          if (elRect.bottom > safeBottom) {
            const delta = elRect.bottom - safeBottom;
            if (container && typeof (container as any).scrollBy === 'function') {
              (container as any).scrollBy({ top: delta, behavior: 'smooth' });
            } else {
              window.scrollBy({ top: delta, behavior: 'smooth' });
            }
          } else {
            // Fallback alignment that respects scroll-margin-bottom
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
          }
        } catch {}
      }, 0);
    }
  };

  /*
   * 🔗 CRITICAL: New payment method handler
   */
  const handleAddNewMethod = () => {
    setSelectedSavedMethod(null);
    setShowNewCardForm(true);
  };

  /*
   * 🔗 CRITICAL: Existing payment method processing
   * 
   * Enhanced to handle payment method attachment errors gracefully
   * and provide better user experience with fallback options.
   */
  const handleUseExistingCard = async () => {
    if (!selectedSavedMethod) return;

    try {
      onProcessingChange(true);
      
      console.log('🔄 Processing payment with saved method:', selectedSavedMethod.stripe_payment_method_id);
      
      // CRITICAL: Create payment intent with existing payment method
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: Math.round(totalAmount * 100),
          currency: 'usd',
          metadata: {
            useExistingPaymentMethod: true,
            paymentMethodId: selectedSavedMethod.stripe_payment_method_id,
            order_type: 'marketplace_purchase'
          }
        }
      });

      if (error) {
        console.error('🚨 Edge function error:', error);
        
        // Handle specific attachment errors with user-friendly messages
        if (error.message?.includes('cannot be attached') || error.message?.includes('PaymentMethod')) {
          throw new Error('This payment method cannot be used. Please select a different card or add a new one.');
        }
        
        throw new Error(error.message || 'Failed to process payment');
      }

      console.log('✅ Payment intent response:', { status: data.status, id: data.payment_intent_id });

      // Handle different payment intent statuses
      if (data.status === 'succeeded') {
        console.log('🎉 Payment succeeded immediately');
        onPaymentSuccess(data.payment_intent_id, selectedSavedMethod.stripe_payment_method_id);
      } else if (data.status === 'requires_action' || data.status === 'requires_source_action') {
        console.log('🔐 Payment requires additional authentication');
        // Payment requires additional authentication
        const stripe = await stripeClientManager.getStripeInstance();
        if (stripe && data.client_secret) {
          const { error, paymentIntent } = await stripe.confirmCardPayment(data.client_secret);
          
          if (error) {
            console.error('🚨 Authentication error:', error);
            throw new Error(error.message || 'Payment authentication failed');
          }
          
          if (paymentIntent?.status === 'succeeded') {
            console.log('🎉 Payment succeeded after authentication');
            onPaymentSuccess(paymentIntent.id, selectedSavedMethod.stripe_payment_method_id);
          } else {
            throw new Error('Payment was not completed successfully');
          }
        } else {
          throw new Error('Unable to complete payment authentication');
        }
      } else if (data.status === 'requires_payment_method') {
        console.log('🔄 Payment requires confirmation with payment method');
        // For requires_payment_method status, we need to confirm with the specific payment method
        if (data.client_secret) {
          const stripe = await stripeClientManager.getStripeInstance();
          if (stripe) {
            const { error, paymentIntent } = await stripe.confirmCardPayment(data.client_secret, {
              payment_method: selectedSavedMethod.stripe_payment_method_id
            });
            
            if (error) {
              console.error('🚨 Payment confirmation error:', error);
              
              // Handle specific error cases
              if (error.code === 'card_declined') {
                throw new Error('Your card was declined. Please try a different payment method.');
              } else if (error.code === 'expired_card') {
                throw new Error('This card has expired. Please use a different payment method.');
              } else if (error.code === 'insufficient_funds') {
                throw new Error('Insufficient funds. Please try a different payment method.');
              }
              
              throw new Error(error.message || 'Payment failed');
            }
            
            if (paymentIntent?.status === 'succeeded') {
              console.log('🎉 Payment succeeded after confirmation');
              onPaymentSuccess(paymentIntent.id, selectedSavedMethod.stripe_payment_method_id);
            } else {
              throw new Error('Payment confirmation was not successful');
            }
          } else {
            throw new Error('Payment system unavailable');
          }
        } else {
          throw new Error('Payment confirmation failed - no client secret');
        }
      } else {
        // Handle any other statuses
        console.log('❓ Unexpected payment status:', data.status);
        throw new Error(`Payment status: ${data.status}. Please try again or contact support.`);
      }
    } catch (error: any) {
      console.error('💥 Payment processing error:', error);
      
      // Provide user-friendly error messages
      let userMessage = error.message;
      
      if (error.message?.includes('PaymentMethod cannot be attached')) {
        userMessage = 'This saved payment method cannot be used. Please select a different card or add a new one.';
        // Optionally trigger refresh of saved payment methods
        onRefreshKeyChange(refreshKey + 1);
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        userMessage = 'Network error. Please check your connection and try again.';
      } else if (!error.message || error.message.includes('undefined')) {
        userMessage = 'Payment processing failed. Please try again or contact support.';
      }
      
      onPaymentError(userMessage);
    } finally {
      onProcessingChange(false);
    }
  };

  // CRITICAL: Handle guest checkout (no user authentication)
  if (!user) {
    return (
      <Elements stripe={stripeClientManager.getStripePromise()}>
        <UnifiedPaymentForm
          clientSecret={clientSecret}
          amount={totalAmount}
          onSuccess={onPaymentSuccess}
          onError={onPaymentError}
          isProcessing={isProcessingPayment}
          onProcessingChange={onProcessingChange}
          allowSaveCard={true}
          mode="payment"
        />
      </Elements>
    );
  }

  return (
    <div className="space-y-6 payment-form-mobile dynamic-content-safe pb-safe-bottom">
      {/* CRITICAL: Saved payment methods section */}
      <SavedPaymentMethodsSection
        onSelectPaymentMethod={handleSelectPaymentMethod}
        onAddNewMethod={handleAddNewMethod}
        selectedMethodId={selectedSavedMethod?.id}
        refreshKey={refreshKey}
      />

      {/* CRITICAL: Selected payment method processing */}
      {selectedSavedMethod && (
        <div ref={payCardRef} className="scroll-safe-bottom">
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">
                    {selectedSavedMethod.card_type} ending in {selectedSavedMethod.last_four}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Expires {selectedSavedMethod.exp_month.toString().padStart(2, '0')}/{selectedSavedMethod.exp_year}
                  </p>
                </div>
                {/* Desktop/Tablet button */}
                <Button 
                  onClick={handleUseExistingCard}
                  disabled={isProcessingPayment}
                  size="lg"
                  className="mobile-button-optimize hidden sm:inline-flex"
                >
                  {isProcessingPayment ? 'Processing...' : `Pay $${totalAmount.toFixed(2)}`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Portal-based mobile CTA for saved card - renders to document.body */}
      {isMobile && selectedSavedMethod && createPortal(
        <Elements stripe={stripeClientManager.getStripePromise()}>
          <div className="portal-pay-cta space-y-3">
            {/* Apple Pay option (iOS Safari only) */}
            <div className="apple-pay-container">
              <ApplePayButton
                items={[{ 
                  id: 'checkout-total', 
                  name: 'Total Order', 
                  price: totalAmount, 
                  image: '', 
                  product_id: 'total', 
                  quantity: 1 
                }]}
                totalAmount={totalAmount}
                onPaymentSuccess={onPaymentSuccess}
                onPaymentError={onPaymentError}
                disabled={isProcessingPayment}
              />
            </div>
            
            {/* Separator between Apple Pay and card payment */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-muted-foreground/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">or</span>
              </div>
            </div>
            
            {/* Traditional card payment button */}
            <Button
              onClick={handleUseExistingCard}
              disabled={isProcessingPayment}
              size="lg"
              className="w-full mobile-button-optimize"
              variant="outline"
            >
              {isProcessingPayment ? 'Processing...' : `Pay with Card $${totalAmount.toFixed(2)}`}
            </Button>
          </div>
        </Elements>,
        document.body
      )}

      {/* CRITICAL: New payment method form */}
      {showNewCardForm && (
        <div className="space-y-4 pb-4">
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="save-card"
                checked={saveNewCard}
                onChange={(e) => setSaveNewCard(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="save-card" className="text-sm">
                Save this card for future purchases
              </label>
            </div>
            <div className="pb-4">
              <Elements stripe={stripeClientManager.getStripePromise()}>
                <UnifiedPaymentForm
                  clientSecret={clientSecret}
                  amount={totalAmount}
                  onSuccess={(paymentIntentId, saveCard) => {
                    // Handle saving payment method if requested
                    if (saveNewCard && saveCard) {
                      // This will be handled in the parent component
                      onRefreshKeyChange(refreshKey + 1);
                    }
                    onPaymentSuccess(paymentIntentId, paymentIntentId); // Use paymentIntentId as second param for compatibility
                  }}
                  onError={onPaymentError}
                  isProcessing={isProcessingPayment}
                  onProcessingChange={onProcessingChange}
                  allowSaveCard={saveNewCard}
                  mode="payment"
                />
              </Elements>
            </div>
          </div>
        </div>
      )}
      <div className="xl:hidden bottom-action-spacer" aria-hidden="true" />
    </div>
  );
};

export default PaymentMethodSelector;
