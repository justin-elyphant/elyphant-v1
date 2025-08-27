import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAutoGiftApproval = () => {
  const [loading, setLoading] = useState(false);

  const approveExecution = async (
    executionId: string, 
    selectedProductIds?: string[], 
    approvalDecision: 'approved' | 'rejected' = 'approved',
    rejectionReason?: string
  ) => {
    setLoading(true);
    try {
      console.log('🔄 Processing approval:', { executionId, selectedProductIds, approvalDecision });

      const { data, error } = await supabase.functions.invoke('approve-auto-gift', {
        body: {
          executionId,
          selectedProductIds,
          approvalDecision,
          rejectionReason
        }
      });

      if (error) {
        console.error('❌ Approval failed:', error);
        throw new Error(error.message || 'Failed to process approval');
      }

      console.log('✅ Approval processed successfully:', data);
      return { success: true, ...data };

    } catch (error) {
      console.error('❌ Error in approval process:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      setLoading(false);
    }
  };

  const rejectExecution = async (executionId: string, rejectionReason?: string) => {
    return approveExecution(executionId, undefined, 'rejected', rejectionReason);
  };

  return {
    approveExecution,
    rejectExecution,
    loading
  };
};