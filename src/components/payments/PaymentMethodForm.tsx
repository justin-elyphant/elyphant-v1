
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
        
        // Reset the card element
        cardElement.clear();
        
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
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div className="p-3 border rounded-md bg-white">
        <CardElement 
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>
      
      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}
      
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full"
      >
        {isProcessing ? "Processing..." : "Add Payment Method"}
      </Button>
    </form>
  );
};

export default PaymentMethodForm;
