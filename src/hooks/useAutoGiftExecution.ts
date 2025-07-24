
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth";
import { unifiedGiftAutomationService, UnifiedGiftExecution as AutoGiftExecution } from "@/services/UnifiedGiftAutomationService";
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

  useEffect(() => {
    loadExecutions();
  }, [user?.id]);

  return {
    executions,
    loading,
    processing,
    loadExecutions,
    processPendingExecutions,
    approveExecution
  };
};
