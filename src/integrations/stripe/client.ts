
// Stripe client integration
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from "@/integrations/supabase/client";

// Use environment variable or fallback to the provided key
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 
  'pk_live_51PxcV7JPK0Zkd1vcAlsGEoYr82Lr7eGxIiYeOG0Gne4lAfwIWOcw3MMJCyL4jk41NDxx5HlYwO8xkhUm3svy8imt00IWkGpE0Z';

// Initialize Stripe
export const stripePromise = loadStripe(stripePublishableKey);

// Function to create a payment session for autogifting
export const createPaymentSession = async (amount: number, eventId: string) => {
  try {
    const { data } = await supabase.functions.invoke('create-payment-session', {
      body: { 
        amount, 
        eventId,
        paymentType: 'autogift'
      }
    });
    
    return data;
  } catch (error) {
    console.error('Error creating payment session:', error);
    throw error;
  }
};
