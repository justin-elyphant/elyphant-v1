import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useAutoGiftPaymentRetry = () => {
  const [isRetrying, setIsRetrying] = useState(false);

  const retryPayment = async (executionId: string, forceImmediate: boolean = false) => {
    try {
      setIsRetrying(true);
      
      const { data, error } = await supabase.functions.invoke('retry-auto-gift-payment', {
        body: { 
          execution_id: executionId, 
          force_immediate: forceImmediate 
        }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        toast.success('Payment retry initiated successfully');
        return { success: true, data };
      } else {
        toast.error(data?.error || 'Failed to retry payment');
        return { success: false, error: data?.error };
      }
    } catch (error: any) {
      console.error('Error retrying payment:', error);
      toast.error(error.message || 'Failed to retry payment');
      return { success: false, error: error.message };
    } finally {
      setIsRetrying(false);
    }
  };

  const updatePaymentMethod = async (executionId: string, paymentMethodId: string) => {
    try {
      setIsRetrying(true);

      // Call edge function to update payment method
      const { data, error } = await supabase.functions.invoke('update-execution-payment-method', {
        body: { 
          execution_id: executionId,
          payment_method_id: paymentMethodId
        }
      });

      if (error) {
        throw error;
      }

      toast.success('Payment method updated. Retry the payment now.');
      return { success: true };
    } catch (error: any) {
      console.error('Error updating payment method:', error);
      toast.error('Failed to update payment method');
      return { success: false, error: error.message };
    } finally {
      setIsRetrying(false);
    }
  };

  return {
    retryPayment,
    updatePaymentMethod,
    isRetrying
  };
};
