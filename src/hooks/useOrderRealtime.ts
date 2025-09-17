import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OrderUpdate {
  id: string;
  status: string;
  zinc_status?: string;
  zinc_timeline_events?: any[];
  merchant_tracking_data?: any;
  last_zinc_update?: string;
}

interface UseOrderRealtimeProps {
  orderId?: string;
  onOrderUpdate?: (order: OrderUpdate) => void;
  showNotifications?: boolean;
}

export function useOrderRealtime({ 
  orderId, 
  onOrderUpdate, 
  showNotifications = true 
}: UseOrderRealtimeProps) {
  
  const getStatusUpdateMessage = (oldStatus: string, newStatus: string): string => {
    const messages: Record<string, string> = {
      'pending': 'Your order is being processed',
      'processing': 'Your order is being prepared',
      'shipped': '📦 Your order has shipped!',
      'delivered': '🎉 Your order has been delivered!',
      'cancelled': 'Your order has been cancelled',
      'failed': 'There was an issue with your order'
    };
    return messages[newStatus] || `Your order status has been updated to ${newStatus}`;
  };

  const handleOrderUpdate = useCallback((payload: any) => {
    const { new: newOrder, old: oldOrder } = payload;
    
    // Only proceed if this is the order we're watching or if no specific order is set
    if (orderId && newOrder.id !== orderId) {
      return;
    }

    console.log('Real-time order update received:', {
      orderId: newOrder.id,
      oldStatus: oldOrder?.status,
      newStatus: newOrder.status,
      hasZincEvents: !!newOrder.zinc_timeline_events?.length
    });

    // Show notification if status changed and notifications are enabled
    if (showNotifications && oldOrder?.status !== newOrder.status) {
      const message = getStatusUpdateMessage(oldOrder?.status, newOrder.status);
      
      if (['shipped', 'delivered'].includes(newOrder.status)) {
        toast.success(message, {
          duration: 5000,
          action: newOrder.merchant_tracking_data?.merchant_order_ids?.[0]?.tracking_url ? {
            label: 'Track Package',
            onClick: () => window.open(newOrder.merchant_tracking_data.merchant_order_ids[0].tracking_url, '_blank')
          } : undefined
        });
      } else if (['cancelled', 'failed'].includes(newOrder.status)) {
        toast.error(message, { duration: 5000 });
      } else {
        toast.info(message, { duration: 3000 });
      }
    }

    // Show notification for new Zinc timeline events
    if (showNotifications && newOrder.zinc_timeline_events?.length > (oldOrder?.zinc_timeline_events?.length || 0)) {
      const latestEvent = newOrder.zinc_timeline_events[newOrder.zinc_timeline_events.length - 1];
      if (latestEvent && latestEvent.source === 'zinc') {
        toast.info(`📋 ${latestEvent.title}: ${latestEvent.description}`, {
          duration: 4000
        });
      }
    }

    // Call the provided update handler
    if (onOrderUpdate) {
      onOrderUpdate(newOrder);
    }
  }, [orderId, onOrderUpdate, showNotifications]);

  useEffect(() => {
    // Set up real-time subscription for order updates
    const channel = supabase
      .channel('order-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          ...(orderId ? { filter: `id=eq.${orderId}` } : {})
        },
        handleOrderUpdate
      )
      .subscribe();

    console.log(`Subscribed to real-time order updates${orderId ? ` for order ${orderId}` : ''}`);

    return () => {
      console.log('Unsubscribing from order updates');
      supabase.removeChannel(channel);
    };
  }, [orderId, handleOrderUpdate]);

  return {
    // This hook doesn't return anything, it just sets up the subscription
    // The real-time updates are handled via the onOrderUpdate callback
  };
}