import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertTriangle, RefreshCw, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface StuckOrder {
  id: string;
  order_number: string;
  status: string;
  zinc_order_id: string | null;
  zinc_request_id: string | null;
  created_at: string;
  updated_at: string;
  total_amount: number;
  payment_status: string;
  notes: string | null;
}

const OrderRecoveryTool = () => {
  const [stuckOrders, setStuckOrders] = useState<StuckOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [recovering, setRecovering] = useState<Set<string>>(new Set());

  const findStuckOrders = async () => {
    setLoading(true);
    try {
      // Find orders stuck in processing for > 1 hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, status, zinc_order_id, zinc_request_id, created_at, updated_at, total_amount, payment_status, notes')
        .eq('status', 'processing')
        .lt('updated_at', oneHourAgo)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setStuckOrders(data || []);
      
      if (data && data.length > 0) {
        toast.warning(`Found ${data.length} stuck order(s)`);
      } else {
        toast.success('No stuck orders found');
      }
    } catch (error) {
      console.error('Error finding stuck orders:', error);
      toast.error('Failed to find stuck orders');
    } finally {
      setLoading(false);
    }
  };

  const recoverOrder = async (orderId: string, action: 'retry' | 'fail') => {
    setRecovering(prev => new Set(prev).add(orderId));
    
    try {
      if (action === 'retry') {
        // Re-invoke process-order-v2 to retry
        const { error } = await supabase.functions.invoke('process-order-v2', {
          body: { orderId }
        });

        if (error) throw error;
        toast.success('Order resubmitted for processing');
      } else {
        // Mark as failed
        const { error } = await supabase
          .from('orders')
          .update({
            status: 'failed',
            notes: 'Manual failed via admin recovery tool',
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);

        if (error) throw error;
        toast.success('Order marked as failed');
      }

      // Refresh the list
      await findStuckOrders();
    } catch (error) {
      console.error(`Error recovering order:`, error);
      toast.error(`Failed to ${action} order`);
    } finally {
      setRecovering(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const getTimeSinceUpdate = (updatedAt: string) => {
    const diff = Date.now() - new Date(updatedAt).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ago`;
    }
    return `${minutes}m ago`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Order Recovery Tool
            </CardTitle>
            <CardDescription>
              Find and recover orders stuck in processing for over 1 hour
            </CardDescription>
          </div>
          <Button onClick={findStuckOrders} disabled={loading}>
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Scan for Stuck Orders
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {stuckOrders.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p>Click "Scan for Stuck Orders" to find orphaned orders</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stuckOrders.map((order) => (
              <div
                key={order.id}
                className="p-4 rounded-lg border border-orange-200 bg-orange-50"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{order.order_number}</span>
                    <Badge variant="destructive">Stuck</Badge>
                    {order.notes && (
                      <Badge variant="outline" title={order.notes}>Has notes</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {getTimeSinceUpdate(order.updated_at)}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                  <div>
                    <span className="text-muted-foreground">Amount:</span>
                    <p className="font-medium">${order.total_amount}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Payment:</span>
                    <p className="font-medium">{order.payment_status}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Zinc Status:</span>
                    <p className="font-medium">{order.zinc_status}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <p className="font-medium">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {order.zinc_order_id && (
                  <div className="text-xs text-muted-foreground mb-3">
                    Zinc Request ID: {order.zinc_order_id}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => recoverOrder(order.id, 'retry')}
                    disabled={recovering.has(order.id) || order.payment_status !== 'succeeded'}
                    size="sm"
                    variant="default"
                  >
                    {recovering.has(order.id) ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry Now
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={() => recoverOrder(order.id, 'fail')}
                    disabled={recovering.has(order.id)}
                    size="sm"
                    variant="destructive"
                  >
                    Mark as Failed
                  </Button>
                </div>

                {order.payment_status !== 'succeeded' && (
                  <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-sm text-red-700">
                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                    Payment not confirmed - retry blocked
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

export default OrderRecoveryTool;
