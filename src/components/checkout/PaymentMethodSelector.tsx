
/**
 * Payment Method Selector Component
 * 
 * ✅ UNIFIED ARCHITECTURE: Uses UnifiedPaymentMethodManager for consistency
 * 
 * Provides comprehensive payment method selection with support for
 * both saved and new payment methods, including mobile-optimized UX.
 * 
 * Unified with /settings and auto-gifting payment management.
 */

import React, { useState, useRef } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { stripeClientManager } from '@/services/payment/StripeClientManager';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/auth';
import { useIsMobile } from '@/hooks/use-mobile';
import UnifiedPaymentMethodManager from '@/components/payments/UnifiedPaymentMethodManager';
import UnifiedPaymentForm from '@/components/payments/UnifiedPaymentForm';

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
  onMethodSelected?: (paymentMethodId: string | null) => void;
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
  onMethodSelected,
  shippingAddress
}) => {
  const { user } = useAuth();
  const [selectedSavedMethod, setSelectedSavedMethod] = useState<PaymentMethod | null>(null);
  const [showNewCardForm, setShowNewCardForm] = useState(false);
  const [saveNewCard, setSaveNewCard] = useState(false);
  const payCardRef = useRef<HTMLDivElement | null>(null);
  const isMobile = useIsMobile();


  /*
   * 🔗 CRITICAL: Payment method selection handler
   * 
   * This function manages the selection between saved and new payment methods
   */
  const handleSelectPaymentMethod = (method: PaymentMethod | null) => {
    setSelectedSavedMethod(method);
    setShowNewCardForm(!method);
    
    // Notify parent component of selection change
    if (onMethodSelected) {
      onMethodSelected(method?.stripe_payment_method_id || null);
    }
    
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
   * Attaches payment method to customer before confirming payment
   */
  const handleUseExistingCard = async () => {
    if (!selectedSavedMethod) return;

    try {
      onProcessingChange(true);
      
      console.log('💳 Using saved payment method:', selectedSavedMethod.stripe_payment_method_id);
      
      const stripe = await stripeClientManager.getStripeInstance();
      
      if (!stripe) {
        throw new Error('Payment system is not available. Please refresh the page and try again.');
      }
      
      // Confirm payment with saved method (already attached when saved)
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: selectedSavedMethod.stripe_payment_method_id
      });
      
      if (error) {
        console.error('🚨 Payment confirmation error:', error);
        
        // Handle specific error cases with user-friendly messages
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
        console.log('✅ Payment succeeded with saved card:', paymentIntent.id);
        onPaymentSuccess(paymentIntent.id, selectedSavedMethod.stripe_payment_method_id);
      } else if (paymentIntent?.status === 'requires_action') {
        console.log('🔐 Payment requires additional authentication');
        throw new Error('Additional authentication required. Please try again.');
      } else {
        console.log('❓ Unexpected payment status:', paymentIntent?.status);
        throw new Error(`Payment status: ${paymentIntent?.status}. Please try again or contact support.`);
      }
    } catch (error: any) {
      console.error('💥 Payment processing error:', error);
      
      let userMessage = error.message || 'Payment processing failed. Please try again.';
      
      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        userMessage = 'Network error. Please check your connection and try again.';
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
      {/* ✅ UNIFIED: Payment methods managed by UnifiedPaymentMethodManager */}
      <Elements stripe={stripeClientManager.getStripePromise()}>
        <UnifiedPaymentMethodManager
          mode="selection"
          onSelectMethod={handleSelectPaymentMethod}
          selectedMethodId={selectedSavedMethod?.id}
          showAddNew={true}
          allowSelection={true}
        />
      </Elements>

      {/* CRITICAL: Selected payment method processing */}
      {selectedSavedMethod && !showNewCardForm && (
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
                {/* Pay button - always visible */}
                <Button 
                  onClick={handleUseExistingCard}
                  disabled={isProcessingPayment}
                  size="lg"
                  className="mobile-button-optimize inline-flex"
                >
                  {isProcessingPayment ? 'Processing...' : `Pay $${totalAmount.toFixed(2)}`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* CRITICAL: New payment method form */}
      {showNewCardForm && (
        <div className="space-y-4 pb-4">
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="save-card"
                checked={saveNewCard}
                onCheckedChange={(checked) => setSaveNewCard(checked as boolean)}
              />
              <Label htmlFor="save-card" className="text-sm cursor-pointer">
                Save this card for future purchases
              </Label>
            </div>
            <div className="pb-4">
              <Elements stripe={stripeClientManager.getStripePromise()}>
                <UnifiedPaymentForm
                  clientSecret={clientSecret}
                  amount={totalAmount}
                  onSuccess={(paymentIntentId, saveCard) => {
                    // Handle saving payment method if requested
                    if (saveNewCard && saveCard) {
                      // Refresh key will trigger UnifiedPaymentMethodManager to reload
                      onRefreshKeyChange(refreshKey + 1);
                    }
                    onPaymentSuccess(paymentIntentId, paymentIntentId);
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
