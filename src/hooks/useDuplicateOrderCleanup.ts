import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SUPABASE_FUNCTIONS } from '@/integrations/supabase/function-types';
import { toast } from 'sonner';

export interface DuplicateCleanupResult {
  totalDuplicateGroups: number;
  duplicateOrdersFound: number;
  duplicateOrdersCancelled: number;
  duplicateDetails: Array<{
    zinc_order_id: string;
    original_order: {
      id: string;
      created_at: string;
      status: string;
    };
    duplicate_orders: Array<{
      id: string;
      created_at: string;
      status: string;
      user_id: string;
      total_amount: number;
    }>;
  }>;
  cleanupActions: Array<{
    action: string;
    order_id?: string;
    zinc_order_id?: string;
    zinc_cancelled?: boolean;
    reason?: string;
    error?: string;
    expired_fingerprints_removed?: number;
  }>;
}

export const useDuplicateOrderCleanup = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<DuplicateCleanupResult | null>(null);

  const runCleanup = async (mode: 'report' | 'cleanup' = 'report', cancelDuplicates = false) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke(SUPABASE_FUNCTIONS.CLEANUP_DUPLICATE_ORDERS, {
        body: {
          mode,
          cancelDuplicates
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      setLastResult(data);

      if (mode === 'report') {
        if (data.totalDuplicateGroups > 0) {
          toast.warning('Duplicate Orders Found', {
            description: `Found ${data.duplicateOrdersFound} duplicate orders across ${data.totalDuplicateGroups} groups`
          });
        } else {
          toast.success('No Duplicates Found', {
            description: 'Order processing system is clean'
          });
        }
      } else {
        toast.success('Cleanup Complete', {
          description: `Cancelled ${data.duplicateOrdersCancelled} duplicate orders`
        });
      }

      return data;
    } catch (error) {
      console.error('Duplicate cleanup error:', error);
      toast.error('Cleanup Failed', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const reportDuplicates = () => runCleanup('report', false);
  
  const cleanupDuplicates = (cancelDuplicates = true) => runCleanup('cleanup', cancelDuplicates);

  return {
    isLoading,
    lastResult,
    reportDuplicates,
    cleanupDuplicates,
    runCleanup
  };
};