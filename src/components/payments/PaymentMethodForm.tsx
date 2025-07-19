
import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface PaymentMethodFormProps {
  onSuccess?: () => void;
}

const PaymentMethodForm = ({ onSuccess }: PaymentMethodFormProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardholderName, setCardholderName] = useState('');
  
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements || !user) {
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Get a reference to the card element
      const cardElement = elements.getElement(CardElement);
      
      if (!cardElement) {
        throw new Error("Card element not found");
      }
      
      // Create payment method
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: cardholderName || user.email,
        },
      });
      
      if (stripeError) {
        throw new Error(stripeError.message);
      }
      
      if (paymentMethod) {
        // Store the payment method in Supabase
        // In a real implementation, you'd likely use a Supabase Edge Function to securely handle this
        // and attach the payment method to the customer in Stripe
        const { error: supabaseError } = await supabase
          .from('payment_methods')
          .insert({
            user_id: user.id,
            payment_method_id: paymentMethod.id,
            last_four: paymentMethod.card?.last4 || '',
            card_type: paymentMethod.card?.brand || '',
            exp_month: paymentMethod.card?.exp_month,
            exp_year: paymentMethod.card?.exp_year
          });
          
        if (supabaseError) {
          throw new Error('Failed to save payment method');
        }
        
        toast.success("Payment method added successfully");
        
        // Reset the form
        cardElement.clear();
        setCardholderName('');
        
        // Call onSuccess if provided
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (err: any) {
      console.error('Error saving payment method:', err);
      setError(err.message || 'An error occurred');
      toast.error(err.message || 'Failed to add payment method');
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Add Payment Method</h3>
        <p className="text-muted-foreground text-sm">
          Securely add a new payment method to your account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="cardholder-name" className="text-sm font-medium">
            Cardholder Name
          </label>
          <input
            id="cardholder-name"
            type="text"
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value)}
            placeholder="Enter cardholder name"
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Card Information</label>
          <div className="p-3 border border-input rounded-md bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <CardElement 
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: 'hsl(var(--foreground))',
                    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
                    '::placeholder': {
                      color: 'hsl(var(--muted-foreground))',
                    },
                  },
                  invalid: {
                    color: 'hsl(var(--destructive))',
                  },
                },
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Your payment information is encrypted and secure
          </p>
        </div>
        
        {error && (
          <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-md">
            {error}
          </div>
        )}
        
        <Button 
          type="submit" 
          disabled={!stripe || isProcessing}
          className="w-full"
        >
          {isProcessing ? "Adding Payment Method..." : "Add Payment Method"}
        </Button>
      </form>
    </div>
  );
};

export default PaymentMethodForm;
