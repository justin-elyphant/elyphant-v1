import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useAutoGiftTesting = () => {
  const [loading, setLoading] = useState(false);

  const triggerDailyCheck = async (userId?: string) => {
    try {
      setLoading(true);
      console.log('Triggering daily auto-gift check...');
      
      const { data, error } = await supabase.functions.invoke('daily-auto-gift-check', {
        body: userId ? { userId } : {}
      });

      if (error) {
        console.error('Error triggering daily check:', error);
        toast.error('Failed to trigger daily check');
        throw error;
      }

      console.log('Daily check result:', data);
      toast.success(`Daily check completed. Created ${data?.executionsCreated || 0} executions.`);
      return data;
    } catch (error) {
      console.error('Daily check error:', error);
      toast.error('Failed to trigger daily check');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const triggerProcessing = async (executionId?: string) => {
    try {
      setLoading(true);
      console.log('Triggering auto-gift processing...');
      
      const { data, error } = await supabase.functions.invoke('process-auto-gifts', {
        body: executionId ? { executionId } : {}
      });

      if (error) {
        console.error('Error triggering processing:', error);
        toast.error('Failed to trigger processing');
        throw error;
      }

      console.log('Processing result:', data);
      toast.success(`Processing completed. Processed ${data?.processedEvents || 0} events.`);
      return data;
    } catch (error) {
      console.error('Processing error:', error);
      toast.error('Failed to trigger processing');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getExecutions = async (userId?: string) => {
    try {
      let query = supabase
        .from('automated_gift_executions')
        .select(`
          *,
          auto_gifting_rules (
            date_type,
            recipient_id,
            pending_recipient_email,
            budget_limit
          ),
          profiles:user_id (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching executions:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch executions:', error);
      toast.error('Failed to load executions');
      return [];
    }
  };

  const getEventLogs = async (userId?: string) => {
    try {
      let query = supabase
        .from('auto_gift_event_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching event logs:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch event logs:', error);
      toast.error('Failed to load event logs');
      return [];
    }
  };

  const getScheduledOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          recipient_name,
          scheduled_delivery_date,
          zinc_scheduled_processing_date,
          hold_for_scheduled_delivery,
          status,
          created_at
        `)
        .eq('hold_for_scheduled_delivery', true)
        .order('zinc_scheduled_processing_date', { ascending: true });

      if (error) {
        console.error('Error fetching scheduled orders:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch scheduled orders:', error);
      toast.error('Failed to load scheduled orders');
      return [];
    }
  };

  return {
    triggerDailyCheck,
    triggerProcessing,
    getExecutions,
    getEventLogs,
    getScheduledOrders,
    loading
  };
};
