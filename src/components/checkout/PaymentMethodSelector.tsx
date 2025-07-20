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

interface PaymentMethod {
  id: string;
  stripe_payment_method_id: string;
  card_type: string;
  last_four: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
}

interface PaymentMethodSelectorProps {
  clientSecret: string;
  totalAmount: number;
  onPaymentSuccess: (paymentIntentId: string, paymentMethodId?: string) => void;
  onPaymentError: (error: string) => void;
  isProcessingPayment: boolean;
  onProcessingChange: (processing: boolean) => void;
  refreshKey: number;
  onRefreshKeyChange: (key: number) => void;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  clientSecret,
  totalAmount,
  onPaymentSuccess,
  onPaymentError,
  isProcessingPayment,
  onProcessingChange,
  refreshKey,
  onRefreshKeyChange
}) => {
  const { user } = useAuth();
  const [selectedSavedMethod, setSelectedSavedMethod] = useState<PaymentMethod | null>(null);
  const [showNewCardForm, setShowNewCardForm] = useState(false);
  const [saveNewCard, setSaveNewCard] = useState(false);

  const handleSelectPaymentMethod = (method: PaymentMethod | null) => {
    setSelectedSavedMethod(method);
    setShowNewCardForm(!method);
  };

  const handleAddNewMethod = () => {
    setSelectedSavedMethod(null);
    setShowNewCardForm(true);
  };

  const handleUseExistingCard = async () => {
    if (!selectedSavedMethod) return;

    try {
      onProcessingChange(true);
      
      // Create a new payment intent with the existing payment method
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

  if (!user) {
    return (
      <StripePaymentForm
        clientSecret={clientSecret}
        amount={totalAmount}
        onSuccess={onPaymentSuccess}
        onError={onPaymentError}
        isProcessing={isProcessingPayment}
        onProcessingChange={onProcessingChange}
      />
    );
  }

  return (
    <div className="space-y-6">
      <SavedPaymentMethodsSection
        onSelectPaymentMethod={handleSelectPaymentMethod}
        onAddNewMethod={handleAddNewMethod}
        selectedMethodId={selectedSavedMethod?.id}
        refreshKey={refreshKey}
      />

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
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodSelector;
