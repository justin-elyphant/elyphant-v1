
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth";
import { unifiedGiftAutomationService, UnifiedGiftExecution as AutoGiftExecution } from "@/services/UnifiedGiftAutomationService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useAutoGiftExecution = () => {
  const { user } = useAuth();
  const [executions, setExecutions] = useState<AutoGiftExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const loadExecutions = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const userExecutions = await unifiedGiftAutomationService.getUserExecutions(user.id);
      setExecutions(userExecutions);
    } catch (error) {
      console.error("Error loading auto-gift executions:", error);
      toast.error("Failed to load auto-gift executions");
    } finally {
      setLoading(false);
    }
  };

  const processPendingExecutions = async () => {
    if (!user?.id || processing) return;

    try {
      setProcessing(true);
      
      // First, reset recent failed executions to pending so they can be reprocessed
      console.log('Resetting failed executions to pending status...');
      const { error: resetError } = await supabase
        .from('automated_gift_executions')
        .update({ 
          status: 'pending',
          error_message: null,
          updated_at: new Date().toISOString()
        })
        .eq('status', 'failed')
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Last 7 days

      if (resetError) {
        console.error('Error resetting failed executions:', resetError);
      } else {
        console.log('Successfully reset failed executions to pending');
      }

      // Call the edge function directly
      console.log('🚀 Calling process-auto-gifts edge function...');
      const { data, error } = await supabase.functions.invoke('process-auto-gifts', {
        body: { userId: user.id }
      });

      if (error) {
        console.error('❌ Error calling process-auto-gifts function:', error);
        throw error;
      }

      console.log('✅ Process auto-gifts completed:', data);
      toast.success(data?.message || 'Auto-gift processing completed');
      
      await loadExecutions(); // Refresh the list
    } catch (error) {
      console.error("Error processing executions:", error);
      toast.error("Failed to process auto-gift executions");
    } finally {
      setProcessing(false);
    }
  };

  const approveExecution = async (executionId: string, selectedProductIds: string[]) => {
    try {
      await unifiedGiftAutomationService.approveExecution(executionId, selectedProductIds);
      toast.success("Auto-gift approved for processing");
      await loadExecutions(); // Refresh the list
    } catch (error) {
      console.error("Error approving execution:", error);
      toast.error("Failed to approve auto-gift");
    }
  };

  const sendEmailApproval = async (
    executionId: string, 
    recipientEmail: string, 
    recipientName: string,
    giftDetails: {
      occasion: string;
      budget: number;
      selectedProducts: Array<{
        id: string;
        title: string;
        price: number;
        image: string;
        marketplace: string;
      }>;
    },
    deliveryDate?: string
  ) => {
    try {
      // Get execution details including address resolution
      const { data: execution } = await supabase
        .from('automated_gift_executions')
        .select('address_metadata')
        .eq('id', executionId)
        .single();

      let shippingAddress = undefined;
      if (execution?.address_metadata) {
        const addressMeta = execution.address_metadata;
        shippingAddress = {
          address: (addressMeta as any)?.address || {},
          source: (addressMeta as any)?.source as 'user_verified' | 'giver_provided' | 'missing',
          needs_confirmation: (addressMeta as any)?.needs_confirmation || false
        };
      }

      const { data, error } = await supabase.functions.invoke('ecommerce-email-orchestrator', {
        body: {
          eventType: 'auto_gift_approval',
          customData: {
            executionId,
            recipientEmail,
            recipientName,
            giftDetails,
            deliveryDate,
            shippingAddress
          }
        }
      });

      if (error) throw error;

      toast.success("Approval email sent successfully!");
      await loadExecutions(); // Refresh to show email sent status
      return data;
    } catch (error) {
      console.error("Error sending approval email:", error);
      toast.error("Failed to send approval email");
      throw error;
    }
  };

  const getApprovalTokens = async (executionId: string) => {
    try {
      const { data, error } = await supabase
        .from('email_approval_tokens')
        .select(`
          *,
          email_delivery_logs(*)
        `)
        .eq('execution_id', executionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching approval tokens:", error);
      return [];
    }
  };

  useEffect(() => {
    loadExecutions();
  }, [user?.id]);

  return {
    executions,
    loading,
    processing,
    loadExecutions,
    processPendingExecutions,
    approveExecution,
    sendEmailApproval,
    getApprovalTokens
  };
};
