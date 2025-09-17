import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const useOrderActions = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const abortOrder = async (orderId: string, reason: string = 'User aborted') => {
    setIsProcessing(true);
    toast.loading("Aborting order...", { id: `abort-${orderId}` });

    try {
      // Use the enhanced Zinc abort functionality
      const { data, error } = await supabase.functions.invoke('zinc-order-management', {
        body: {
          action: 'abort_order',
          orderId: orderId,
          cancellationReason: reason
        }
      });

      if (error) {
        console.error('Order abort failed:', error);
        toast.error(`Failed to abort order: ${error.message}`, { id: `abort-${orderId}` });
        return false;
      }

      if (data.success) {
        let successMessage = 'Order aborted successfully';
        
        if (data.operationType === 'cancel') {
          successMessage = 'Order cancelled successfully (abort not available)';
        } else if (data.abortMethod === 'immediate') {
          successMessage = 'Order aborted immediately';
        } else if (data.abortMethod === 'polled') {
          successMessage = 'Order aborted after processing';
        } else if (data.abortMethod === 'timeout_fallback') {
          successMessage = 'Order cancelled (abort timed out)';
        }
        
        if (data.refundInitiated) {
          successMessage += '. Refund will be processed within 3-5 business days.';
        }

        toast.success(successMessage, { id: `abort-${orderId}` });
        return true;
      } else {
        toast.error(data.error || 'Failed to abort order', { id: `abort-${orderId}` });
        return false;
      }
    } catch (error) {
      console.error('Unexpected error during abort:', error);
      toast.error('An unexpected error occurred while aborting the order', { id: `abort-${orderId}` });
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelOrder = async (orderId: string, reason: string = 'User cancelled') => {
    setIsProcessing(true);
    toast.loading("Cancelling order...", { id: `cancel-${orderId}` });

    try {
      // Use the enhanced Zinc order management function
      const { data, error } = await supabase.functions.invoke('zinc-order-management', {
        body: {
          action: 'cancel_order',
          orderId: orderId,
          cancellationReason: reason
        }
      });

      if (error) {
        console.error('Order cancellation failed:', error);
        toast.error(`Failed to cancel order: ${error.message}`, { id: `cancel-${orderId}` });
        return false;
      }

      if (data.success) {
        let successMessage = 'Order cancelled successfully';
        
        if (data.refundInitiated) {
          successMessage += '. Refund will be processed within 3-5 business days.';
        }
        
        if (data.zincCancellation === 'successful') {
          successMessage += ' The order was also cancelled with our fulfillment partner.';
        }

        toast.success(successMessage, { id: `cancel-${orderId}` });
        return true;
      } else {
        toast.error(data.error || 'Failed to cancel order', { id: `cancel-${orderId}` });
        return false;
      }
    } catch (error) {
      console.error('Unexpected error during cancellation:', error);
      toast.error('An unexpected error occurred while cancelling the order', { id: `cancel-${orderId}` });
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const retryOrder = async (orderId: string, useZincNativeRetry: boolean = false) => {
    setIsProcessing(true);
    toast.loading("Retrying order...", { id: `retry-${orderId}` });

    try {
      const functionName = useZincNativeRetry ? 'zinc-order-management' : 'process-zma-order';
      const body = useZincNativeRetry 
        ? { action: 'retry_with_zinc', orderId }
        : { orderId, isTestMode: false, retryAttempt: true };

      const { data, error } = await supabase.functions.invoke(functionName, { body });

      if (error) {
        console.error('Order retry failed:', error);
        toast.error(`Failed to retry order: ${error.message}`, { id: `retry-${orderId}` });
        return false;
      }

      if (data.success) {
        const message = useZincNativeRetry 
          ? `Order retried using enhanced system. New tracking ID: ${data.newRequestId}`
          : 'Order retry initiated successfully';
        
        toast.success(message, { id: `retry-${orderId}` });
        return true;
      } else {
        toast.error(data.error || 'Failed to retry order', { id: `retry-${orderId}` });
        return false;
      }
    } catch (error) {
      console.error('Unexpected error during retry:', error);
      toast.error('An unexpected error occurred while retrying the order', { id: `retry-${orderId}` });
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const checkOrderStatus = async (orderId: string) => {
    setIsProcessing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('zinc-order-management', {
        body: {
          action: 'check_order_status',
          orderId: orderId
        }
      });

      if (error) {
        console.error('Order status check failed:', error);
        toast.error('Failed to check order status');
        return null;
      }

      return data;
    } catch (error) {
      console.error('Unexpected error during status check:', error);
      toast.error('An unexpected error occurred while checking order status');
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    abortOrder,
    cancelOrder,
    retryOrder,
    checkOrderStatus,
    isProcessing
  };
};