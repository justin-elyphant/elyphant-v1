
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { orderVerificationService } from '@/services/orderVerificationService';

interface ZincStatus {
  orderId: string;
  zincOrderId?: string;
  zmaOrderId?: string;
  orderMethod?: 'zinc_api' | 'zma';
  status?: string;
  error?: string;
  debugInfo?: any;
}

const ZincOrderDebugger = () => {
  const [orderRequestId, setOrderRequestId] = useState('');
  const [orderMethod, setOrderMethod] = useState<'zinc_api' | 'zma'>('zinc_api');
  const [loading, setLoading] = useState(false);
  const [statusResult, setStatusResult] = useState<ZincStatus | null>(null);
  const [debugLogs, setDebugLogs] = useState<string>('');
  const { toast } = useToast();

  const checkOrderStatus = async () => {
    if (!orderRequestId.trim()) {
      toast("Please enter an order request ID");
      return;
    }

    setLoading(true);
    setStatusResult(null);
    setDebugLogs('');

    try {
      console.log(`🔍 Checking ${orderMethod} order status for: ${orderRequestId}`);
      
      if (orderMethod === 'zma') {
        // Check ZMA order status
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('id, order_number, status, payment_status, zinc_order_id, zinc_request_id, notes')
          .eq('id', orderRequestId)
          .single();

        if (orderError || !orderData) {
          setDebugLogs(`Database Error: ${orderError?.message || 'Order not found'}`);
          toast(`Order not found`);
          return;
        }

        setStatusResult({
          orderId: orderRequestId,
          zincOrderId: orderData.zinc_order_id || undefined,
          orderMethod: 'zinc_api',
          status: orderData.status,
          debugInfo: orderData
        });

        setDebugLogs(`ZMA Order Data:\n${JSON.stringify(orderData, null, 2)}`);
        toast(`ZMA Order Status: ${orderData.status}`);

      } else {
        // Check Zinc API order status
        const { data, error } = await supabase.functions.invoke('check-zinc-order-status', {
          body: {
            singleOrderId: orderRequestId,
            debugMode: true
          }
        });

        if (error) {
          console.error('❌ Edge function error:', error);
          setDebugLogs(`Edge Function Error: ${error.message}\n\nContext: ${error.context || 'No additional context'}`);
          toast(`API Error: ${error.message}`);
          return;
        }

        console.log('✅ Edge function response:', data);
        setDebugLogs(`API Response:\n${JSON.stringify(data, null, 2)}`);

        if (data.success && data.results && data.results.length > 0) {
          const result = data.results[0];
          setStatusResult({
            orderId: orderRequestId,
            zincOrderId: result.zinc_order_id,
            orderMethod: 'zinc_api',
            status: result.status,
            error: result.error,
            debugInfo: result
          });
          
          toast(`Status Check Complete - Order status: ${result.status}`);
        } else {
          setStatusResult({
            orderId: orderRequestId,
            orderMethod: 'zinc_api',
            error: data.error || 'No results returned'
          });
          
          toast(`No Results: ${data.error || 'No order data found'}`);
        }
      }

    } catch (error) {
      console.error('💥 Unexpected error:', error);
      setDebugLogs(`Unexpected Error: ${error.message}\n\nStack trace: ${error.stack}`);
      setStatusResult({
        orderId: orderRequestId,
        orderMethod,
        error: error.message
      });
      
      toast("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const manualVerifyOrder = async () => {
    if (!orderRequestId.trim()) {
      toast("Please enter an order request ID");
      return;
    }

    setLoading(true);
    
    try {
      console.log(`🔄 Manually verifying order: ${orderRequestId}`);
      
      const result = await orderVerificationService.verifyOrder(orderRequestId);
      
      setStatusResult({
        orderId: result.orderId,
        zincOrderId: result.zincOrderId,
        status: result.status,
        error: result.error,
        debugInfo: result
      });
      
      setDebugLogs(`Manual Verification Result:\n${JSON.stringify(result, null, 2)}`);
      
      toast(result.verified ? "Manual Verification Complete - Order verified successfully" : `Verification failed: ${result.error}`);
      
    } catch (error) {
      console.error('💥 Manual verification error:', error);
      setDebugLogs(`Manual Verification Error: ${error.message}`);
      
      toast(`Verification Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const retryFailedOrder = async () => {
    if (!orderRequestId.trim()) {
      toast("Please enter an order request ID");
      return;
    }

    setLoading(true);
    
    try {
      console.log(`🔄 Retrying failed order: ${orderRequestId}`);
      
      // Clear failed zma_order_id to allow retry
      const { error: clearError } = await supabase
        .from('orders')
        .update({
          zma_order_id: null,
          zma_error: null,
          status: 'pending'
        })
        .eq('id', orderRequestId);
        
      if (clearError) {
        throw new Error(`Failed to clear order for retry: ${clearError.message}`);
      }
      
      // Call the ZMA processing function
      const { data, error } = await supabase.functions.invoke('process-zma-order', {
        body: {
          orderId: orderRequestId,
          isTestMode: false,
          debugMode: true,
          retryAttempt: true
        }
      });

      if (error) {
        throw new Error(`Retry failed: ${error.message}`);
      }

      setDebugLogs(`Retry Result:\n${JSON.stringify(data, null, 2)}`);
      
      if (data.success) {
        toast("Order retry successful! Check Zinc dashboard.");
        // Refresh status after retry
        await checkOrderStatus();
      } else {
        toast(`Retry failed: ${data.error}`);
      }
      
    } catch (error) {
      console.error('💥 Order retry error:', error);
      setDebugLogs(`Retry Error: ${error.message}`);
      
      toast(`Retry Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>Order Lookup</CardTitle>
          <CardDescription>
            Enter an order request ID to check its status with Zinc and verify synchronization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter order request ID (e.g., c5526964e99a6214ad309b2bd4dbc184)"
              value={orderRequestId}
              onChange={(e) => setOrderRequestId(e.target.value)}
              className="flex-1"
            />
            <Select value={orderMethod} onValueChange={(value: 'zinc_api' | 'zma') => setOrderMethod(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="zinc_api">Zinc API</SelectItem>
                <SelectItem value="zma">ZMA</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <Button 
              onClick={checkOrderStatus} 
              disabled={loading}
            >
              {loading ? 'Checking...' : 'Check Status'}
            </Button>
            
            <Button 
              onClick={manualVerifyOrder} 
              disabled={loading}
              variant="outline"
            >
              {loading ? 'Verifying...' : 'Manual Verify'}
            </Button>
            
            <Button 
              onClick={retryFailedOrder} 
              disabled={loading}
              variant="destructive"
            >
              {loading ? 'Retrying...' : 'Retry Order'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status Result Section */}
      {statusResult && (
        <Card>
          <CardHeader>
            <CardTitle>Status Result</CardTitle>
            <CardDescription>
              Current status information for order {statusResult.orderId}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Order ID</label>
                <p className="font-mono text-sm">{statusResult.orderId}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Order Method</label>
                <div className="mt-1">
                  <Badge variant={statusResult.orderMethod === 'zma' ? 'default' : 'secondary'}>
                    {statusResult.orderMethod === 'zma' ? 'ZMA' : 'Zinc API'}
                  </Badge>
                </div>
              </div>
              
              {statusResult.zincOrderId && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Zinc Order ID</label>
                  <p className="font-mono text-sm">{statusResult.zincOrderId}</p>
                </div>
              )}
              
              {statusResult.zmaOrderId && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ZMA Order ID</label>
                  <p className="font-mono text-sm">{statusResult.zmaOrderId}</p>
                </div>
              )}
            </div>
            
            {statusResult.status && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="mt-1">
                  <Badge variant={statusResult.status === 'placed' ? 'default' : 'secondary'}>
                    {statusResult.status}
                  </Badge>
                </div>
              </div>
            )}
            
            {statusResult.error && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Error</label>
                <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">{statusResult.error}</p>
              </div>
            )}
            
            {statusResult.debugInfo?.zma_error && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">ZMA/Zinc Error Details</label>
                <pre className="text-xs text-destructive bg-destructive/10 p-2 rounded overflow-auto max-h-32">
                  {typeof statusResult.debugInfo.zma_error === 'string' 
                    ? statusResult.debugInfo.zma_error 
                    : JSON.stringify(statusResult.debugInfo.zma_error, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Debug Logs Section */}
      {debugLogs && (
        <Card>
          <CardHeader>
            <CardTitle>Debug Logs</CardTitle>
            <CardDescription>
              Detailed information from the API calls and processing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-96 whitespace-pre-wrap">
              {debugLogs}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ZincOrderDebugger;
