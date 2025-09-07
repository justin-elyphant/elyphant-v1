import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StuckOrder {
  id: string;
  orderNumber: string;
  success: boolean;
  error?: string;
  nextRetryAt?: string;
}

interface ManualRetryResult {
  success: boolean;
  message: string;
  fixedCount?: number;
  fixedOrders?: StuckOrder[];
  orderId?: string;
}

const StuckOrdersManager = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<ManualRetryResult | null>(null);

  const handleImmediateRetry = async (orderId: string) => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('manual-order-retry', {
        body: {
          orderId,
          action: 'immediate_retry'
        }
      });

      if (error) throw error;

      setLastResult(data);
      toast.success(`Order ${orderId} retry triggered successfully`);
    } catch (error) {
      console.error('Error triggering immediate retry:', error);
      toast.error(`Failed to trigger retry: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFixAllStuckOrders = async () => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('manual-order-retry', {
        body: {
          action: 'fix_stuck_orders'
        }
      });

      if (error) throw error;

      setLastResult(data);
      
      if (data.fixedCount > 0) {
        toast.success(`Fixed ${data.fixedCount} stuck orders`);
      } else {
        toast.info('No stuck orders found');
      }
    } catch (error) {
      console.error('Error fixing stuck orders:', error);
      toast.error(`Failed to fix stuck orders: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRunTimeoutMonitor = async () => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('order-timeout-monitor');

      if (error) throw error;

      setLastResult(data);
      
      if (data.fixedCount > 0) {
        toast.success(`Timeout monitor fixed ${data.fixedCount} stuck orders`);
      } else {
        toast.info('System healthy - no stuck orders found');
      }
    } catch (error) {
      console.error('Error running timeout monitor:', error);
      toast.error(`Failed to run timeout monitor: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Stuck Orders Management
          </CardTitle>
          <CardDescription>
            Tools to identify and fix orders that are stuck in processing status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={handleFixAllStuckOrders}
              disabled={isProcessing}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              Fix All Stuck Orders
            </Button>

            <Button
              onClick={handleRunTimeoutMonitor}
              disabled={isProcessing}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Run Timeout Monitor
            </Button>

            <Button
              onClick={() => handleImmediateRetry('16cb8901-58ba-4f7d-9116-3c76ba7e19b7')}
              disabled={isProcessing}
              className="flex items-center gap-2"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Retry Specific Order
            </Button>
          </div>

          {lastResult && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-3">Last Operation Result</h3>
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {lastResult.success ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Success
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      Failed
                    </Badge>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {new Date().toLocaleString()}
                  </span>
                </div>
                
                <p className="text-sm mb-2">{lastResult.message}</p>
                
                {lastResult.fixedCount !== undefined && (
                  <p className="text-sm">Fixed Orders: {lastResult.fixedCount}</p>
                )}

                {lastResult.fixedOrders && lastResult.fixedOrders.length > 0 && (
                  <div className="mt-3">
                    <h4 className="font-medium text-sm mb-2">Fixed Orders:</h4>
                    <div className="space-y-1">
                      {lastResult.fixedOrders.map((order) => (
                        <div key={order.id} className="text-xs bg-background p-2 rounded border">
                          <span className="font-mono">{order.orderNumber}</span>
                          {order.success ? (
                            <Badge variant="default" className="ml-2 text-xs">
                              Fixed
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="ml-2 text-xs">
                              Failed
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StuckOrdersManager;