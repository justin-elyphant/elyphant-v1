import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PaymentVerificationResult {
  success: boolean;
  payment_status: string;
  order_status: string;
  order?: any;
  error?: string;
}

export const usePaymentVerification = () => {
  const [isVerifying, setIsVerifying] = useState(false);

  const verifyPayment = useCallback(async (
    sessionId?: string, 
    paymentIntentId?: string,
    showToast = true
  ): Promise<PaymentVerificationResult> => {
    setIsVerifying(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('confirm-payment', {
        body: { 
          session_id: sessionId,
          payment_intent_id: paymentIntentId
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.success) {
        if (showToast && data.payment_status === 'succeeded') {
          toast.success('Payment confirmed successfully!');
        }
        return data;
      } else {
        throw new Error('Payment verification failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment verification failed';
      if (showToast) {
        toast.error(errorMessage);
      }
      return {
        success: false,
        payment_status: 'failed',
        order_status: 'payment_failed',
        error: errorMessage
      };
    } finally {
      setIsVerifying(false);
    }
  }, []);

  const verifyWithRetry = useCallback(async (
    sessionId?: string,
    paymentIntentId?: string,
    maxRetries = 3,
    delays = [0, 5000, 15000]
  ): Promise<PaymentVerificationResult> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const result = await verifyPayment(sessionId, paymentIntentId, false);
      
      if (result.success && result.payment_status === 'succeeded') {
        return result;
      }
      
      if (result.payment_status === 'pending' && attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delays[attempt - 1]));
        continue;
      }
      
      if (attempt === maxRetries) {
        return result;
      }
    }
    
    return {
      success: false,
      payment_status: 'failed',
      order_status: 'payment_failed',
      error: 'Payment verification timeout'
    };
  }, [verifyPayment]);

  return {
    verifyPayment,
    verifyWithRetry,
    isVerifying
  };
};