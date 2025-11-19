import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';

interface GiftActivity {
  id: string;
  type: 'auto_gift_executed' | 'manual_gift_sent' | 'rule_created' | 'rule_updated' | 'execution_failed' | 'notification_sent';
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'failed' | 'pending' | 'info';
  metadata?: {
    recipientName?: string;
    productName?: string;
    amount?: number;
    ruleId?: string;
    orderId?: string;
    executionId?: string;
    errorMessage?: string;
  };
}

export const useGiftActivity = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<GiftActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGiftActivity = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch automated gift executions
        const { data: executions, error: executionsError } = await supabase
          .from('automated_gift_executions')
          .select(`
            id,
            status,
            execution_date,
            total_amount,
            selected_products,
            error_message,
            created_at,
            updated_at,
            auto_gifting_rules!inner(
              id,
              date_type,
              recipient_id,
              pending_recipient_email
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (executionsError) {
          throw executionsError;
        }

        // Fetch recent auto-gift rules changes
        const { data: rules, error: rulesError } = await supabase
          .from('auto_gifting_rules')
          .select(`
            id,
            date_type,
            created_at,
            updated_at,
            is_active,
            budget_limit,
            recipient_id,
            pending_recipient_email
          `)
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(10);

        if (rulesError) {
          throw rulesError;
        }

        // Fetch recent manual orders
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select(`
            id,
            order_number,
            status,
            total_amount,
            created_at,
            line_items
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (ordersError) {
          throw ordersError;
        }

        // Fetch notifications
        const { data: notifications, error: notificationsError } = await supabase
          .from('auto_gift_notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(15);

        if (notificationsError) {
          console.warn('Error fetching notifications:', notificationsError);
        }

        const processedActivities: GiftActivity[] = [];

        // Process executions
        executions?.forEach(execution => {
          const rule = execution.auto_gifting_rules as any;
          const recipientName = rule?.pending_recipient_email?.split('@')[0] || 'Unknown Recipient';
          const selectedProduct = execution.selected_products?.[0];
          
          let activityType: GiftActivity['type'] = 'auto_gift_executed';
          let status: GiftActivity['status'] = 'success';
          let title = '';
          let description = '';

          switch (execution.status) {
            case 'completed':
              activityType = 'auto_gift_executed';
              status = 'success';
              title = `Auto-gift sent to ${recipientName}`;
              description = `Successfully sent ${selectedProduct?.name || 'gift'} for ${rule?.date_type}`;
              break;
            case 'failed':
              activityType = 'execution_failed';
              status = 'failed';
              title = `Auto-gift failed for ${recipientName}`;
              description = execution.error_message || 'Gift execution failed';
              break;
            case 'pending':
            case 'processing':
              activityType = 'auto_gift_executed';
              status = 'pending';
              title = `Auto-gift processing for ${recipientName}`;
              description = `Processing ${rule?.date_type} gift`;
              break;
          }

          processedActivities.push({
            id: `execution-${execution.id}`,
            type: activityType,
            title,
            description,
            timestamp: execution.updated_at || execution.created_at,
            status,
            metadata: {
              recipientName,
              productName: selectedProduct?.name,
              amount: execution.total_amount,
              ruleId: rule?.id,
              executionId: execution.id,
              errorMessage: execution.error_message
            }
          });
        });

        // Process rule changes (only recently created or significantly updated)
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        rules?.forEach(rule => {
          const createdAt = new Date(rule.created_at);
          const updatedAt = new Date(rule.updated_at);
          const recipientName = rule.pending_recipient_email?.split('@')[0] || 'Recipient';

          // Only show recently created rules
          if (createdAt > oneWeekAgo) {
            processedActivities.push({
              id: `rule-created-${rule.id}`,
              type: 'rule_created',
              title: `New auto-gift rule created`,
              description: `Set up ${rule.date_type} auto-gift for ${recipientName} with $${rule.budget_limit} budget`,
              timestamp: rule.created_at,
              status: 'info',
              metadata: {
                recipientName,
                amount: rule.budget_limit,
                ruleId: rule.id
              }
            });
          }
        });

        // Process manual orders (non-auto-gift orders)
        orders?.forEach(order => {
          // Check if this order is from an auto-gift execution
          const isAutoGift = executions?.some(exec => exec.id === order.id);
          if (isAutoGift) return; // Skip auto-gift orders as they're already processed

          const recipientName = 'Recipient';

          // Extract product name from line_items JSONB
          const lineItems = order.line_items as any;
          const productName = lineItems?.[0]?.title || lineItems?.[0]?.name || 'Unknown Product';

          let status: GiftActivity['status'] = 'success';
          switch (order.status) {
            case 'failed':
            case 'cancelled':
              status = 'failed';
              break;
            case 'pending':
            case 'processing':
              status = 'pending';
              break;
            default:
              status = 'success';
          }

          processedActivities.push({
            id: `order-${order.id}`,
            type: 'manual_gift_sent',
            title: `Manual gift sent to ${recipientName}`,
            description: `Ordered ${productName} for $${order.total_amount}`,
            timestamp: order.created_at,
            status,
            metadata: {
              recipientName,
              productName,
              amount: order.total_amount,
              orderId: order.id
            }
          });
        });

        // Process notifications
        notifications?.forEach(notification => {
          processedActivities.push({
            id: `notification-${notification.id}`,
            type: 'notification_sent',
            title: notification.title,
            description: notification.message,
            timestamp: notification.created_at,
            status: 'info',
            metadata: {
              executionId: notification.execution_id
            }
          });
        });

        // Sort all activities by timestamp (most recent first)
        processedActivities.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        // Limit to most recent 50 activities
        setActivities(processedActivities.slice(0, 50));
      } catch (err) {
        console.error('Error fetching gift activity:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch gift activity');
      } finally {
        setLoading(false);
      }
    };

    fetchGiftActivity();
  }, [user]);

  return { activities, loading, error, refetch: () => setLoading(true) };
};