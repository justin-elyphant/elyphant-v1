import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle, Clock, AlertTriangle, RefreshCw } from 'lucide-react';

interface RetryNotificationProps {
  onSuccess?: (orderId: string, result: any) => void;
  onError?: (orderId: string, error: string) => void;
}

interface RetryOrder {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  total_amount: number;
  payment_status: string;
  payment_retry_count: number;
}

const RetryNotificationService: React.FC<RetryNotificationProps> = ({ onSuccess, onError }) => {
  const [retryOrders, setRetryOrders] = useState<RetryOrder[]>([]);
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const fetchRetryOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, status, retry_count, next_retry_at, created_at, total_amount, payment_status')
        .eq('status', 'retry_pending')
        .order('next_retry_at', { ascending: true })
        .limit(10);

      if (error) throw error;
      setRetryOrders(data || []);
    } catch (error) {
      console.error('Error fetching retry orders:', error);
      toast.error('Failed to fetch retry orders');
    }
  };

  const manualRetry = async (orderId: string) => {
    if (processing.has(orderId)) return;

    setProcessing(prev => new Set(prev).add(orderId));
    
    try {
      console.log(`🔄 Manually triggering retry for order ${orderId}`);
      
      // Call the retry processing function
      const { data, error } = await supabase.functions.invoke('process-retry-pending-orders', {
        body: { orderId }
      });

      if (error) throw error;

      if (data.success) {
        toast.success(`Order ${orderId} retry successful!`);
        onSuccess?.(orderId, data);
        await fetchRetryOrders(); // Refresh the list
      } else {
        toast.error(`Order ${orderId} retry failed: ${data.error}`);
        onError?.(orderId, data.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to retry order ${orderId}:`, error);
      toast.error(`Retry failed: ${errorMessage}`);
      onError?.(orderId, errorMessage);
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const refreshRetryOrders = async () => {
    setLoading(true);
    try {
      await fetchRetryOrders();
      toast.success('Retry orders refreshed');
    } catch (error) {
      toast.error('Failed to refresh retry orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRetryOrders();
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchRetryOrders, 60000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (order: RetryOrder) => {
    // No retry tracking in orders table anymore, show based on status
    if (order.status === 'failed') {
      return 'bg-red-100 border-red-200';
    } else if (order.status === 'processing') {
      return 'bg-yellow-100 border-yellow-200';
    }
    return 'bg-blue-100 border-blue-200';
  };

  const getStatusBadge = (order: RetryOrder) => {
    if (order.status === 'failed') {
      return <Badge variant="destructive">Failed</Badge>;
    } else if (retryTime.getTime() - now.getTime() < 30 * 60 * 1000) {
      return <Badge variant="secondary">Due Soon</Badge>;
    }
    return <Badge variant="outline">Scheduled</Badge>;
  };

  const formatTimeUntilRetry = (retryTime: string) => {
    const now = new Date();
    const retry = new Date(retryTime);
    const diff = retry.getTime() - now.getTime();
    
    if (diff <= 0) {
      return 'Ready for retry';
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Retry Processing Queue
            </CardTitle>
            <CardDescription>
              Orders waiting for automatic retry due to ZMA overload or system issues
            </CardDescription>
          </div>
          <Button onClick={refreshRetryOrders} disabled={loading} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {retryOrders.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <p className="text-muted-foreground">No orders in retry queue</p>
            <p className="text-sm text-muted-foreground">All orders are processing normally</p>
          </div>
        ) : (
          <div className="space-y-3">
            {retryOrders.map((order) => (
              <div
                key={order.id}
                className={`p-4 rounded-lg border ${getStatusColor(order)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">{order.order_number}</span>
                      {getStatusBadge(order)}
                      <Badge variant="outline">Attempt {order.payment_retry_count + 1}/3</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Amount:</span>
                        <p className="font-medium">${order.total_amount}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Payment:</span>
                        <p className="font-medium">{order.payment_status}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Next Retry:</span>
                        <p className="font-medium">{formatTimeUntilRetry(order.next_retry_at)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Created:</span>
                        <p className="font-medium">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    <Button
                      onClick={() => manualRetry(order.id)}
                      disabled={processing.has(order.id) || order.payment_status !== 'succeeded'}
                      size="sm"
                      variant="outline"
                    >
                      {processing.has(order.id) ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Retrying...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Manual Retry
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                {order.payment_status !== 'succeeded' && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                    Payment not confirmed - retry blocked to prevent duplicate charges
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RetryNotificationService;