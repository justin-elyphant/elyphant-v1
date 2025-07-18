import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cancelOrder as zincCancelOrder } from "@/components/marketplace/zinc/services/orderProcessingService";

export const useOrderActions = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const cancelOrder = async (orderId: string, reason?: string) => {
    try {
      setIsProcessing(true);

      // First check if order can be cancelled using our database function
      const { data: canCancel, error: checkError } = await supabase
        .rpc('can_cancel_order', { order_id: orderId });

      if (checkError) {
        console.error('Error checking if order can be cancelled:', checkError);
        toast.error('Error checking order status');
        return false;
      }

      if (!canCancel) {
        toast.error('This order cannot be cancelled in its current state');
        return false;
      }

      // Get order details to check if it has a zinc_order_id
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('zinc_order_id, order_number')
        .eq('id', orderId)
        .single();

      if (fetchError) {
        console.error('Error fetching order:', fetchError);
        toast.error('Error fetching order details');
        return false;
      }

      // If order has a zinc_order_id, cancel it through Zinc API first
      let zincCancelled = true;
      if (order.zinc_order_id) {
        console.log('Cancelling Zinc order:', order.zinc_order_id);
        zincCancelled = await zincCancelOrder(order.zinc_order_id);
        
        if (!zincCancelled) {
          console.warn('Failed to cancel through Zinc API, proceeding with database cancellation');
        }
      }

      // Cancel in our database using the database function
      const { data: result, error: cancelError } = await supabase
        .rpc('cancel_order', { 
          order_id: orderId, 
          cancellation_reason: reason || 'User cancelled' 
        });

      if (cancelError) {
        console.error('Error cancelling order:', cancelError);
        toast.error('Failed to cancel order');
        return false;
      }

      if (result?.success) {
        toast.success(`Order ${order.order_number} cancelled successfully`);
        return true;
      } else {
        toast.error(result?.error || 'Failed to cancel order');
        return false;
      }

    } catch (error) {
      console.error('Unexpected error during cancellation:', error);
      toast.error('An unexpected error occurred');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      setIsProcessing(true);

      const { error } = await supabase
        .from('orders')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order status:', error);
        toast.error('Failed to update order status');
        return false;
      }

      toast.success('Order status updated successfully');
      return true;

    } catch (error) {
      console.error('Unexpected error updating status:', error);
      toast.error('An unexpected error occurred');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    cancelOrder,
    updateOrderStatus,
    isProcessing
  };
};