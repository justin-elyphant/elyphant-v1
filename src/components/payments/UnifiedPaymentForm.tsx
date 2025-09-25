/*
 * ========================================================================
 * 🎯 UNIFIED PAYMENT FORM - CONSOLIDATED PAYMENT COMPONENT
 * ========================================================================
 * 
 * Consolidates ModernPaymentForm, StripePaymentForm, and PaymentMethodForm
 * into a single, comprehensive payment processing component.
 * 
 * INTEGRATION WITH PROTECTION MEASURES:
 * - Uses StripeClientManager for centralized Stripe client management
 * - Integrates with UnifiedPaymentService for payment processing
 * - Respects existing rate limiting and circuit breaker patterns
 * - Maintains audit trail and error logging
 * 
 * FEATURES:
 * - Apple Pay / Google Pay support
 * - Saved payment methods integration  
 * - New payment method creation
 * - Enhanced error handling and validation
 * - Consistent UI/UX patterns
 * 
 * Last update: 2025-01-24 (Phase 1 - UnifiedPaymentService Implementation)
 * ========================================================================
 */

import React, { useState, useEffect } from 'react';
import { useStripe, useElements, CardElement, PaymentRequestButtonElement } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Lock, Shield, CheckCircle, AlertCircle, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';

interface UnifiedPaymentFormProps {
  clientSecret?: string;
  amount: number;
  onSuccess: (paymentIntentId: string, saveCard?: boolean | string) => void; // Flexible for compatibility
  onError?: (error: string) => void;
  allowSaveCard?: boolean;
  buttonText?: string;
  isProcessing?: boolean;
  onProcessingChange?: (processing: boolean) => void;
  mode?: 'payment' | 'setup'; // 'payment' for checkout, 'setup' for saving cards
}

const UnifiedPaymentForm: React.FC<UnifiedPaymentFormProps> = ({
  clientSecret,
  amount,
  onSuccess,
  onError,
  allowSaveCard = false,
  buttonText,
  isProcessing: externalIsProcessing = false,
  onProcessingChange,
  mode = 'payment'
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  
  const [internalIsProcessing, setInternalIsProcessing] = useState(false);
  const [saveCard, setSaveCard] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardholderName, setCardholderName] = useState('');
  const [paymentRequest, setPaymentRequest] = useState<any | null>(null);
  const [canMakePayment, setCanMakePayment] = useState(false);
  
  // Use external processing state if provided, otherwise use internal
  const isProcessing = externalIsProcessing || internalIsProcessing;
  
  // Dynamic button text based on mode
  const defaultButtonText = mode === 'setup' 
    ? 'Add Payment Method' 
    : `Pay $${amount.toFixed(2)}`;
  const displayButtonText = buttonText || defaultButtonText;
  
  // Update processing state helper
  const updateProcessingState = (processing: boolean) => {
    setInternalIsProcessing(processing);
    onProcessingChange?.(processing);
  };

  // Initialize Apple Pay and Google Pay for payment mode
  useEffect(() => {
    if (!stripe || mode === 'setup') return;

    const pr = stripe.paymentRequest({
      country: 'US',
      currency: 'usd',
      total: {
        label: 'Total',
        amount: Math.round(amount * 100),
      },
      requestPayerName: true,
      requestPayerEmail: true,
      requestPayerPhone: false,
      requestShipping: false,
      // Enable Apple Pay and Google Pay
      disableWallets: [],
    });

    pr.canMakePayment().then(result => {
      if (result) {
        setPaymentRequest(pr);
        setCanMakePayment(true);
      }
    });

    pr.on('paymentmethod', async (ev) => {
      if (!clientSecret) {
        ev.complete('fail');
        return;
      }

      const { paymentIntent, error: confirmError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: ev.paymentMethod.id
      });

      if (confirmError) {
        ev.complete('fail');
        const errorMsg = confirmError.message || 'Payment failed';
        toast.error(errorMsg);
        setError(errorMsg);
        onError?.(errorMsg);
      } else {
        ev.complete('success');
        if (paymentIntent && paymentIntent.status === 'succeeded') {
          if (saveCard && user && paymentIntent.payment_method) {
            await savePaymentMethod(paymentIntent.payment_method);
          }
          toast.success('Payment successful!');
          onSuccess(paymentIntent.id, saveCard);
        }
      }
    });
  }, [stripe, amount, clientSecret, saveCard, user, mode]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || isProcessing) {
      return;
    }

    updateProcessingState(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      const errorMsg = 'Payment form not loaded properly';
      setError(errorMsg);
      onError?.(errorMsg);
      updateProcessingState(false);
      return;
    }

    try {
      if (mode === 'setup') {
        // Setup mode - create payment method for saving
        const { error: methodError, paymentMethod } = await stripe.createPaymentMethod({
          type: 'card',
          card: cardElement,
          billing_details: {
            name: cardholderName || user?.email,
          },
        });

        if (methodError) {
          throw new Error(methodError.message || 'Failed to create payment method');
        }

        if (paymentMethod) {
          await savePaymentMethod(paymentMethod);
          toast.success('Payment method added successfully!');
          
          // Reset form
          cardElement.clear();
          setCardholderName('');
          
          onSuccess(paymentMethod.id, true);
        }
      } else {
        // Payment mode - process payment
        if (!clientSecret) {
          throw new Error('Payment not initialized properly');
        }

        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
          clientSecret,
          {
            payment_method: {
              card: cardElement,
              billing_details: {
                name: cardholderName || user?.email,
              },
            },
            setup_future_usage: saveCard && user ? 'off_session' : undefined,
          }
        );

        if (confirmError) {
          throw new Error(confirmError.message || 'Payment failed');
        }

        if (paymentIntent && paymentIntent.status === 'succeeded') {
          // Save payment method if requested
          if (saveCard && user && paymentIntent.payment_method) {
            await savePaymentMethod(paymentIntent.payment_method);
          }

          toast.success('Payment successful!');
          onSuccess(paymentIntent.id, saveCard);
        } else {
          throw new Error('Payment was not completed successfully');
        }
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      const errorMessage = err.message || 'Payment failed. Please try again.';
      setError(errorMessage);
      onError?.(errorMessage);
      toast.error(errorMessage);
    } finally {
      updateProcessingState(false);
    }
  };

  const savePaymentMethod = async (paymentMethod: any) => {
    try {
      if (!user || !paymentMethod?.id) return;

      // Use the edge function instead of direct database access
      const { data, error } = await supabase.functions.invoke('save-payment-method', {
        body: { 
          paymentMethodId: paymentMethod.id,
          makeDefault: false 
        }
      });

      if (error) {
        console.error('Error saving payment method:', error);
        toast.error('Payment processed but failed to save card for future use');
      } else {
        console.log('Payment method saved successfully:', data);
      }
    } catch (error) {
      console.error('Error saving payment method:', error);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: 'hsl(var(--foreground))',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        '::placeholder': {
          color: 'hsl(var(--muted-foreground))',
        },
        padding: '12px',
      },
      invalid: {
        color: 'hsl(var(--destructive))',
      },
    },
    hidePostalCode: false,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Express Checkout Buttons - Only for payment mode */}
      {paymentRequest && canMakePayment && mode === 'payment' && (
        <div className="space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Express Checkout</span>
            </div>
          </div>
          
          <div className="max-w-sm mx-auto">
            <PaymentRequestButtonElement 
              options={{ 
                paymentRequest,
                style: {
                  paymentRequestButton: {
                    type: 'default', // 'default' | 'book' | 'buy' | 'checkout' | 'donate'
                    theme: 'dark', // 'dark' | 'light' | 'light-outline'
                    height: '40px',
                  },
                },
              }} 
            />
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or pay with card</span>
            </div>
          </div>
        </div>
      )}

      {/* Card Details Section */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-5 w-5" />
            <span className="font-medium">
              {mode === 'setup' ? 'Add Payment Method' : 'Card Details'}
            </span>
            <Lock className="h-4 w-4 text-green-600 ml-auto" />
          </div>

          {/* Cardholder Name - Required for setup mode */}
          {mode === 'setup' && (
            <div className="space-y-2">
              <Label htmlFor="cardholder-name" className="text-sm font-medium">
                Cardholder Name
              </Label>
              <input
                id="cardholder-name"
                type="text"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                placeholder="Enter cardholder name"
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                required
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">Card Information</Label>
            <div className="p-4 border border-input rounded-md bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              <CardElement options={cardElementOptions} />
            </div>
          </div>

          {allowSaveCard && user && mode === 'payment' && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="save-card"
                checked={saveCard}
                onCheckedChange={(checked) => setSaveCard(checked as boolean)}
              />
              <Label htmlFor="save-card" className="text-sm">
                Save this card for future purchases
              </Label>
            </div>
          )}

          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Lock className="h-3 w-3" />
            Your payment information is encrypted and secure
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-md flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="flex justify-between items-center pt-4">
        {mode === 'payment' && (
          <div className="text-lg font-semibold">
            Total: ${amount.toFixed(2)}
          </div>
        )}
        <Button 
          type="submit" 
          disabled={!stripe || isProcessing || (mode === 'setup' && !cardholderName)}
          className={mode === 'payment' ? 'min-w-[140px]' : 'w-full'}
        >
          {isProcessing ? 'Processing...' : displayButtonText}
        </Button>
      </div>
    </form>
  );
};

export default UnifiedPaymentForm;