
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
      await unifiedGiftAutomationService.processPendingExecutions(user.id);
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
        .select('ai_agent_source')
        .eq('id', executionId)
        .single();

      let shippingAddress = undefined;
      if (execution?.ai_agent_source?.address_resolution) {
        const addressMeta = execution.ai_agent_source.address_resolution;
        shippingAddress = {
          address: addressMeta.address || {},
          source: addressMeta.source as 'user_verified' | 'giver_provided' | 'missing',
          needs_confirmation: addressMeta.needs_confirmation || false
        };
      }

      const { data, error } = await supabase.functions.invoke('send-auto-gift-approval-email', {
        body: {
          executionId,
          recipientEmail,
          recipientName,
          giftDetails,
          deliveryDate,
          shippingAddress
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
