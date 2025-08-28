/*
 * ========================================================================
 * 🔄 AUTO-GIFT EXECUTION PROCESSOR HOOK
 * ========================================================================
 * 
 * React hook for managing auto-gift execution processing
 * Integrates with UnifiedOrderProcessingService for stuck execution pipeline
 * 
 * Features:
 * - Process individual stuck executions
 * - Process all stuck executions
 * - Real-time status tracking
 * - Error handling and retry mechanisms
 * 
 * Last update: 2025-01-28 (MVP Auto-Gifting Implementation)
 * ========================================================================
 */

import { useState, useCallback } from 'react';
import { unifiedOrderProcessingService, ProcessExecutionResult } from '@/services/gifting/UnifiedOrderProcessingService';
import { toast } from 'sonner';

export const useAutoGiftExecutionProcessor = () => {
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<ProcessExecutionResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  /**
   * Process a single stuck execution
   */
  const processExecution = useCallback(async (executionId: string): Promise<ProcessExecutionResult> => {
    try {
      setProcessing(true);
      setError(null);
      
      console.log(`🔄 Processing execution: ${executionId}`);
      toast.loading('Processing auto-gift execution...', { id: executionId });
      
      const result = await unifiedOrderProcessingService.processStuckExecution(executionId);
      
      if (result.success) {
        toast.success('Auto-gift execution completed successfully!', { 
          id: executionId,
          description: `Order ${result.order_id} created and processed`
        });
      } else {
        toast.error('Auto-gift execution failed', { 
          id: executionId,
          description: result.error 
        });
      }
      
      setResults(prev => [...prev, result]);
      return result;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      toast.error('Failed to process execution', { 
        id: executionId,
        description: errorMessage 
      });
      
      const failedResult: ProcessExecutionResult = {
        success: false,
        execution_id: executionId,
        error: errorMessage
      };
      
      setResults(prev => [...prev, failedResult]);
      return failedResult;
      
    } finally {
      setProcessing(false);
    }
  }, []);

  /**
   * Process all stuck executions
   */
  const processAllStuckExecutions = useCallback(async (): Promise<ProcessExecutionResult[]> => {
    try {
      setProcessing(true);
      setError(null);
      setResults([]);
      
      console.log('🔄 Processing all stuck executions...');
      toast.loading('Processing all stuck auto-gift executions...', { id: 'process-all' });
      
      const results = await unifiedOrderProcessingService.processAllStuckExecutions();
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      
      if (successCount > 0) {
        toast.success(`Processed ${successCount} executions successfully!`, { 
          id: 'process-all',
          description: failureCount > 0 ? `${failureCount} executions failed` : 'All executions completed'
        });
      } else if (failureCount > 0) {
        toast.error(`Failed to process ${failureCount} executions`, { id: 'process-all' });
      } else {
        toast.info('No stuck executions found to process', { id: 'process-all' });
      }
      
      setResults(results);
      return results;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      toast.error('Failed to process stuck executions', { 
        id: 'process-all',
        description: errorMessage 
      });
      return [];
      
    } finally {
      setProcessing(false);
    }
  }, []);

  /**
   * Get stuck executions without processing
   */
  const getStuckExecutions = useCallback(async () => {
    try {
      return await unifiedOrderProcessingService.getStuckExecutions();
    } catch (error) {
      console.error('Error fetching stuck executions:', error);
      return [];
    }
  }, []);

  /**
   * Clear results and errors
   */
  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    processing,
    results,
    error,
    processExecution,
    processAllStuckExecutions,
    getStuckExecutions,
    clearResults
  };
};