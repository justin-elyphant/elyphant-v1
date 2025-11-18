import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const useOrderActions = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  // Note: abortOrder removed - Zinc only supports cancellation via API

  const cancelOrder = async (orderId: string, reason: string = 'Admin cancelled') => {
    setIsProcessing(true);
    toast.loading("Cancelling order with Zinc...", { id: `cancel-${orderId}` });

    try {
      // Use new cancel-zinc-order function for admin cancellations
      const { data, error } = await supabase.functions.invoke('cancel-zinc-order', {
        body: { orderId }
      });

      if (error) {
        console.error('Order cancellation failed:', error);
        toast.error(`Failed to cancel order: ${error.message}`, { id: `cancel-${orderId}` });
        return false;
      }

      if (data.success) {
        toast.success(data.message || 'Cancellation request sent to Zinc', { id: `cancel-${orderId}` });
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
    cancelOrder,
    retryOrder,
    checkOrderStatus,
    isProcessing
  };
};