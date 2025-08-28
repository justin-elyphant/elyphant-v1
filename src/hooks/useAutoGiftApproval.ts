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
    console.log('🚀 [useAutoGiftApproval] Starting approval process...');
    console.log('📊 [useAutoGiftApproval] Request details:', { 
      executionId, 
      selectedProductIds, 
      approvalDecision,
      rejectionReason,
      timestamp: new Date().toISOString()
    });
    
    setLoading(true);
    try {
      console.log('🔄 [useAutoGiftApproval] Making function call to approve-auto-gift...');

      const { data, error } = await supabase.functions.invoke('approve-auto-gift', {
        body: {
          executionId,
          selectedProductIds,
          approvalDecision,
          rejectionReason
        }
      });

      console.log('📡 [useAutoGiftApproval] Raw function response:', { data, error });

      if (error) {
        console.error('❌ [useAutoGiftApproval] Function returned error:', error);
        console.error('🔍 [useAutoGiftApproval] Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw new Error(error.message || 'Failed to process approval');
      }

      console.log('✅ [useAutoGiftApproval] Function call successful!');
      console.log('📋 [useAutoGiftApproval] Response data:', JSON.stringify(data, null, 2));
      return { success: true, ...data };

    } catch (error) {
      console.error('💥 [useAutoGiftApproval] Caught exception in approval process:', error);
      console.error('🔍 [useAutoGiftApproval] Exception details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      console.log('🏁 [useAutoGiftApproval] Approval process completed, setting loading to false');
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