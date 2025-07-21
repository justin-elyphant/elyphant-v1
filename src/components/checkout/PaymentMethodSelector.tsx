
/*
 * ========================================================================
 * 🚨 CRITICAL PAYMENT COMPONENT - DO NOT SIMPLIFY 🚨
 * ========================================================================
 * 
 * This component handles sophisticated payment processing including:
 * - Stripe integration for payment processing
 * - Saved payment method management
 * - New payment method collection
 * - Payment method validation and security
 * 
 * ⚠️  CRITICAL FEATURES:
 * - Integrates with Stripe Elements
 * - Manages saved payment methods
 * - Handles payment method saving preferences
 * - Processes both new and existing payment methods
 * 
 * 🔗 DEPENDENCIES:
 * - Stripe React components
 * - SavedPaymentMethodsSection
 * - StripePaymentForm
 * - Supabase for payment method storage
 * 
 * 🚫 DO NOT REPLACE WITH simple payment forms
 * 
 * ========================================================================
 */

import React, { useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/integrations/stripe/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/auth';
import { supabase } from '@/integrations/supabase/client';
import SavedPaymentMethodsSection from './SavedPaymentMethodsSection';
import StripePaymentForm from '@/components/marketplace/checkout/StripePaymentForm';

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

  /*
   * 🔗 CRITICAL: Payment method selection handler
   * 
   * This function manages the selection between saved and new payment methods
   */
  const handleSelectPaymentMethod = (method: PaymentMethod | null) => {
    setSelectedSavedMethod(method);
    setShowNewCardForm(!method);
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
   * This function processes payments using saved payment methods
   * through Supabase edge functions.
   */
  const handleUseExistingCard = async () => {
    if (!selectedSavedMethod) return;

    try {
      onProcessingChange(true);
      
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

      if (error) throw error;

      // If payment is successful, call the success handler
      if (data.status === 'succeeded') {
        onPaymentSuccess(data.payment_intent_id, selectedSavedMethod.stripe_payment_method_id);
      } else {
        throw new Error('Payment was not successful');
      }
    } catch (error: any) {
      console.error('Error processing existing payment method:', error);
      onPaymentError(error.message || 'Failed to process payment with saved card');
    } finally {
      onProcessingChange(false);
    }
  };

  // CRITICAL: Handle guest checkout (no user authentication)
  if (!user) {
    return (
      <Elements stripe={stripePromise}>
        <StripePaymentForm
          clientSecret={clientSecret}
          amount={totalAmount}
          onSuccess={onPaymentSuccess}
          onError={onPaymentError}
          isProcessing={isProcessingPayment}
          onProcessingChange={onProcessingChange}
          shippingAddress={shippingAddress}
        />
      </Elements>
    );
  }

  return (
    <div className="space-y-6">
      {/* CRITICAL: Saved payment methods section */}
      <SavedPaymentMethodsSection
        onSelectPaymentMethod={handleSelectPaymentMethod}
        onAddNewMethod={handleAddNewMethod}
        selectedMethodId={selectedSavedMethod?.id}
        refreshKey={refreshKey}
      />

      {/* CRITICAL: Selected payment method processing */}
      {selectedSavedMethod && (
        <Card>
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
              <Button 
                onClick={handleUseExistingCard}
                disabled={isProcessingPayment}
                size="lg"
              >
                {isProcessingPayment ? 'Processing...' : `Pay $${totalAmount.toFixed(2)}`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CRITICAL: New payment method form */}
      {showNewCardForm && (
        <div className="space-y-4">
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
            <Elements stripe={stripePromise}>
              <StripePaymentForm
                clientSecret={clientSecret}
                amount={totalAmount}
                onSuccess={(paymentIntentId, paymentMethodId) => {
                  // Handle saving payment method if requested
                  if (saveNewCard && paymentMethodId) {
                    // This will be handled in the parent component
                    onRefreshKeyChange(refreshKey + 1);
                  }
                  onPaymentSuccess(paymentIntentId, paymentMethodId);
                }}
                onError={onPaymentError}
                isProcessing={isProcessingPayment}
                onProcessingChange={onProcessingChange}
                savePaymentMethod={saveNewCard}
                shippingAddress={shippingAddress}
              />
            </Elements>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodSelector;
