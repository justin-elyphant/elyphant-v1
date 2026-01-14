/*
 * ========================================================================
 * 🔄 AUTO-GIFT EXECUTION PROCESSOR COMPONENT
 * ========================================================================
 * 
 * UI component for processing stuck auto-gift executions
 * Provides manual trigger for completing the stuck execution pipeline
 * 
 * Features:
 * - Process individual executions
 * - Process all stuck executions
 * - Real-time status updates
 * - Error handling and retry options
 * 
 * Last update: 2025-01-28 (MVP Auto-Gifting Implementation)
 * ========================================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, Play, RefreshCw } from 'lucide-react';
import { unifiedOrderProcessingService, ProcessExecutionResult } from '@/services/gifting/UnifiedOrderProcessingService';
import { useNicoleExecutions } from '@/hooks/useNicoleExecutions';
import { toast } from 'sonner';

interface AutoGiftExecutionProcessorProps {
  className?: string;
  onExecutionCompleted?: (executionId: string, orderId?: string) => void;
}

const AutoGiftExecutionProcessor: React.FC<AutoGiftExecutionProcessorProps> = ({
  className = '',
  onExecutionCompleted
}) => {
  const [stuckExecutions, setStuckExecutions] = useState<any[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<ProcessExecutionResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const getStuckExecutions = useCallback(async () => {
    return await unifiedOrderProcessingService.getStuckExecutions();
  }, []);

  const processExecution = useCallback(async (executionId: string): Promise<ProcessExecutionResult> => {
    setProcessing(true);
    try {
      const result = await unifiedOrderProcessingService.processStuckExecution(executionId);
      setResults(prev => [...prev, result]);
      return result;
    } finally {
      setProcessing(false);
    }
  }, []);

  const processAllStuckExecutions = useCallback(async (): Promise<ProcessExecutionResult[]> => {
    setProcessing(true);
    try {
      const results = await unifiedOrderProcessingService.processAllStuckExecutions();
      setResults(results);
      return results;
    } finally {
      setProcessing(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  const { executions, loading: executionsLoading, fetchExecutions } = useNicoleExecutions();

  // Load stuck executions on mount
  useEffect(() => {
    loadStuckExecutions();
  }, []);

  // Refresh executions when processing completes
  useEffect(() => {
    if (results.length > 0) {
      const completedExecutions = results.filter(r => r.success);
      completedExecutions.forEach(result => {
        if (onExecutionCompleted) {
          onExecutionCompleted(result.execution_id, result.order_id);
        }
      });
      
      // Refresh the executions list
      fetchExecutions();
      loadStuckExecutions();
    }
  }, [results, onExecutionCompleted, fetchExecutions]);

  const loadStuckExecutions = async () => {
    try {
      const stuck = await getStuckExecutions();
      setStuckExecutions(stuck);
      console.log(`📊 Found ${stuck.length} stuck executions`);
    } catch (error) {
      console.error('Error loading stuck executions:', error);
      toast.error('Failed to load stuck executions');
    }
  };

  const handleProcessExecution = async (executionId: string) => {
    setSelectedExecution(executionId);
    try {
      const result = await processExecution(executionId);
      if (result.success) {
        // Remove from stuck executions list
        setStuckExecutions(prev => prev.filter(exec => exec.id !== executionId));
      }
    } finally {
      setSelectedExecution(null);
    }
  };

  const handleProcessAll = async () => {
    try {
      const results = await processAllStuckExecutions();
      const successfulIds = results.filter(r => r.success).map(r => r.execution_id);
      
      // Remove successful executions from stuck list
      setStuckExecutions(prev => prev.filter(exec => !successfulIds.includes(exec.id)));
    } catch (error) {
      console.error('Error processing all executions:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Auto-Gift Execution Processor
          </CardTitle>
          <CardDescription>
            Process stuck auto-gift executions through the complete pipeline: Order → Payment → Fulfillment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleProcessAll}
              disabled={processing || stuckExecutions.length === 0}
              variant="default"
              size="sm"
              className="flex-1"
            >
              {processing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing All...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Process All Stuck ({stuckExecutions.length})
                </>
              )}
            </Button>
            
            <Button
              onClick={loadStuckExecutions}
              variant="outline"
              size="sm"
              disabled={processing}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            
            {results.length > 0 && (
              <Button
                onClick={clearResults}
                variant="ghost"
                size="sm"
              >
                Clear Results
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Error:</span>
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stuck Executions List */}
      {stuckExecutions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Stuck Executions ({stuckExecutions.length})</CardTitle>
            <CardDescription>
              These executions are stuck in "processing" status and need manual intervention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stuckExecutions.map((execution) => (
                <div
                  key={execution.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(execution.status)}
                      <span className="font-medium">
                        Execution {execution.id.slice(0, 8)}...
                      </span>
                      <Badge className={getStatusColor(execution.status)}>
                        {execution.status}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>Amount: ${execution.total_amount || 0}</div>
                      <div>Date: {new Date(execution.execution_date).toLocaleDateString()}</div>
                      {execution.ai_agent_source?.agent && (
                        <div>Source: {execution.ai_agent_source.agent} ({execution.ai_agent_source.confidence_score})</div>
                      )}
                      {execution.error_message && (
                        <div className="text-red-600">Error: {execution.error_message}</div>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => handleProcessExecution(execution.id)}
                    disabled={processing || selectedExecution === execution.id}
                    size="sm"
                    variant="outline"
                  >
                    {selectedExecution === execution.id ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Process
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Stuck Executions */}
      {stuckExecutions.length === 0 && !executionsLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">All Clear!</h3>
              <p className="text-muted-foreground">
                No stuck executions found. All auto-gift executions are processing normally.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Results</CardTitle>
            <CardDescription>
              Results from the latest execution processing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    result.success 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="font-medium">
                      {result.execution_id.slice(0, 8)}...
                    </span>
                    <Badge className={
                      result.success 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }>
                      {result.success ? 'Completed' : 'Failed'}
                    </Badge>
                  </div>
                  
                  {result.order_id && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      Order created: {result.order_id.slice(0, 8)}...
                    </div>
                  )}
                  
                  {result.error && (
                    <div className="mt-2 text-sm text-red-600">
                      Error: {result.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AutoGiftExecutionProcessor;