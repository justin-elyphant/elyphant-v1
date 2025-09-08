import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';

interface ScheduledGift {
  id: string;
  orderId: string;
  recipientName: string;
  recipientEmail?: string;
  productName: string;
  productImage?: string;
  scheduledDate: string;
  deliveryDate?: string;
  status: 'scheduled' | 'processing' | 'shipped' | 'delivered' | 'failed';
  orderNumber?: string;
  totalAmount?: number;
  trackingNumber?: string;
  isAutoGift: boolean;
  ruleId?: string;
  executionId?: string;
}

export const useScheduledGifts = () => {
  const { user } = useAuth();
  const [gifts, setGifts] = useState<ScheduledGift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScheduledGifts = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch orders with scheduled delivery dates or that are still processing
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select(`
            id,
            order_number,
            total_amount,
            status,
            tracking_number,
            shipping_address,
            scheduled_delivery_date,
            created_at,
            updated_at,
            zinc_order_id,
            recipient_email,
            order_items (
              id,
              product_name,
              product_image,
              quantity,
              price
            )
          `)
          .eq('user_id', user.id)
          .or('scheduled_delivery_date.not.is.null,status.in.(scheduled,processing,shipped)')
          .order('created_at', { ascending: false });

        if (ordersError) {
          throw ordersError;
        }

        // Fetch automated gift executions to link auto-gifts
        const { data: executions, error: executionsError } = await supabase
          .from('automated_gift_executions')
          .select(`
            id,
            order_id,
            rule_id,
            execution_date,
            status,
            selected_products,
            auto_gifting_rules!inner(
              recipient_id,
              pending_recipient_email
            )
          `)
          .eq('user_id', user.id)
          .not('order_id', 'is', null);

        if (executionsError) {
          console.warn('Error fetching executions:', executionsError);
        }

        // Create execution lookup map
        const executionMap = new Map(
          executions?.map(exec => [exec.order_id, exec]) || []
        );

        // Process orders into scheduled gifts
        const processedGifts: ScheduledGift[] = [];

        orders?.forEach(order => {
          const execution = executionMap.get(order.id);
          const isAutoGift = !!execution;
          
          // Get recipient name from shipping address or execution data
          let recipientName = 'Unknown Recipient';
          let recipientEmail = order.recipient_email;

          if (order.shipping_address && typeof order.shipping_address === 'object') {
            const shippingAddr = order.shipping_address as any;
            recipientName = shippingAddr.name || recipientName;
          }

          if (execution?.auto_gifting_rules) {
            const rule = execution.auto_gifting_rules as any;
            recipientEmail = rule.pending_recipient_email || recipientEmail;
          }

          // Process each order item as a separate scheduled gift
          order.order_items?.forEach(item => {
            // Map order status to gift status
            let giftStatus: ScheduledGift['status'] = 'scheduled';
            switch (order.status) {
              case 'processing':
              case 'pending':
                giftStatus = 'processing';
                break;
              case 'shipped':
                giftStatus = 'shipped';
                break;
              case 'delivered':
                giftStatus = 'delivered';
                break;
              case 'failed':
              case 'cancelled':
                giftStatus = 'failed';
                break;
              default:
                giftStatus = 'scheduled';
            }

            processedGifts.push({
              id: `${order.id}-${item.id}`,
              orderId: order.id,
              recipientName,
              recipientEmail,
              productName: item.product_name || 'Unknown Product',
              productImage: item.product_image,
              scheduledDate: order.scheduled_delivery_date || order.created_at,
              deliveryDate: order.updated_at,
              status: giftStatus,
              orderNumber: order.order_number,
              totalAmount: item.price * item.quantity,
              trackingNumber: order.tracking_number,
              isAutoGift,
              ruleId: execution?.rule_id,
              executionId: execution?.id
            });
          });
        });

        // Sort by scheduled date (most recent first)
        processedGifts.sort((a, b) => 
          new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()
        );

        setGifts(processedGifts);
      } catch (err) {
        console.error('Error fetching scheduled gifts:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch scheduled gifts');
      } finally {
        setLoading(false);
      }
    };

    fetchScheduledGifts();
  }, [user]);

  return { gifts, loading, error, refetch: () => setLoading(true) };
};