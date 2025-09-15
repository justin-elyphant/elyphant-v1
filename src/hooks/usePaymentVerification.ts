import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { 
  unifiedPaymentVerificationService, 
  type PaymentVerificationResult 
} from '@/services/payment/UnifiedPaymentVerificationService';

export const usePaymentVerification = () => {
  const [isVerifying, setIsVerifying] = useState(false);

  const verifyPayment = useCallback(async (
    sessionId?: string, 
    paymentIntentId?: string,
    showToast = true
  ): Promise<PaymentVerificationResult> => {
    setIsVerifying(true);
    
    try {
      const result = await unifiedPaymentVerificationService.verifyAndUpdatePaymentStatus(
        sessionId,
        paymentIntentId,
        {
          maxRetries: 1,
          showToast,
          source: 'component'
        }
      );

      if (showToast && result.success && result.payment_status === 'succeeded') {
        toast.success('Payment confirmed successfully!');
      } else if (showToast && !result.success) {
        toast.error(result.error || 'Payment verification failed');
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment verification failed';
      if (showToast) {
        toast.error(errorMessage);
      }
      return {
        success: false,
        payment_status: 'failed',
        order_status: 'payment_failed',
        error: errorMessage,
        source: 'stripe_api'
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
    setIsVerifying(true);
    
    try {
      const result = await unifiedPaymentVerificationService.verifyAndUpdatePaymentStatus(
        sessionId,
        paymentIntentId,
        {
          maxRetries,
          retryDelays: delays,
          showToast: false,
          source: 'retry_component'
        }
      );

      return result;
    } finally {
      setIsVerifying(false);
    }
  }, []);

  const quickVerify = useCallback(async (
    sessionId?: string,
    paymentIntentId?: string
  ): Promise<PaymentVerificationResult> => {
    return unifiedPaymentVerificationService.quickVerification(sessionId, paymentIntentId);
  }, []);

  const getPaymentStatus = useCallback(async (
    sessionId?: string,
    paymentIntentId?: string
  ) => {
    return unifiedPaymentVerificationService.getPaymentStatus(sessionId, paymentIntentId);
  }, []);

  return {
    verifyPayment,
    verifyWithRetry,
    quickVerify,
    getPaymentStatus,
    isVerifying
  };
};