import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertTriangle, RefreshCw, Clock, Package, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format, subDays } from 'date-fns';

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

type ManualRecoveryOrder = {
  id: string;
  order_number: string;
  status: string;
  zinc_order_id: string | null;
  payment_status: string | null;
  scheduled_delivery_date: string | null;
};

const OrderRecoveryTool = () => {
  const [stuckOrders, setStuckOrders] = useState<StuckOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [recovering, setRecovering] = useState<Set<string>>(new Set());
  const [manualOrderId, setManualOrderId] = useState('');

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

  const recoverManualOrder = async () => {
    if (!manualOrderId.trim()) {
      toast.error('Please enter an order ID or order number');
      return;
    }

    setRecovering(prev => new Set(prev).add(manualOrderId));
    
    try {
      // Try to find the order by ID or order_number
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('id, order_number, status, zinc_order_id, payment_status, scheduled_delivery_date')
        .or(`id.eq.${manualOrderId},order_number.eq.${manualOrderId}`)
        .maybeSingle();

      const typedOrder = order as ManualRecoveryOrder | null;

      if (fetchError || !typedOrder) {
        toast.error('Order not found');
        setRecovering(prev => {
          const newSet = new Set(prev);
          newSet.delete(manualOrderId);
          return newSet;
        });
        return;
      }

      // Prevent an expected 500 by gating retries behind payment confirmation.
      // Deferred-payment scheduled orders are created as pending_payment with payment_status=pending
      // until Stage 0 (T-7) creates a fresh authorization and capture occurs.
      if (typedOrder.payment_status === 'pending' || typedOrder.status === 'pending_payment') {
        const arrivalDate = typedOrder.scheduled_delivery_date ? new Date(typedOrder.scheduled_delivery_date) : null;
        const captureDate = arrivalDate ? subDays(arrivalDate, 7) : null;
        const submitDate = arrivalDate ? subDays(arrivalDate, 3) : null;

        toast.error('Payment not confirmed (deferred payment order)', {
          description:
            `This order is payment_status=pending, so process-order-v2 will refuse it. ` +
            `Use Trunkline → Auto-Gift Testing → Run Scheduler with simulated date ` +
            `${captureDate ? format(captureDate, 'yyyy-MM-dd') : '(arrival-7 days)'} (capture) ` +
            `then ${submitDate ? format(submitDate, 'yyyy-MM-dd') : '(arrival-3 days)'} (submit to Zinc).`,
        });
        return;
      }

      // Re-invoke process-order-v2 to retry
      const { error } = await supabase.functions.invoke('process-order-v2', {
        body: { orderId: typedOrder.id }
      });

      if (error) throw error;
      
      toast.success(`Order ${typedOrder.order_number} submitted to Zinc for processing`);
      setManualOrderId('');
    } catch (error) {
      console.error('Error recovering manual order:', error);
      toast.error('Failed to recover order');
    } finally {
      setRecovering(prev => {
        const newSet = new Set(prev);
        newSet.delete(manualOrderId);
        return newSet;
      });
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
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Package className="h-6 w-6 text-primary" />
          Universal Order Recovery Tool
        </CardTitle>
        <CardDescription className="text-base">
          Works for all order types: one-off purchases, auto-gifts, and scheduled orders. 
          Automatically detects stuck orders or manually recover any order by ID/number.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Usage Guide */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>How it works:</strong> Safe retry with payment validation, Zinc status check, 
            and automatic processing via process-order-v2. Works for all order types.
          </AlertDescription>
        </Alert>

        {/* Automatic Detection Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">🔍 Stuck Orders (Auto-Detection)</h3>
              <p className="text-sm text-muted-foreground">
                Orders stuck for over 1 hour (all types: one-off, auto-gift, scheduled)
              </p>
            </div>
            <Button 
              onClick={findStuckOrders} 
              disabled={loading}
              variant="outline"
            >
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Find Stuck Orders
                </>
              )}
            </Button>
          </div>

          {stuckOrders.length > 0 && (
            <div className="space-y-3">
              {stuckOrders.map(order => (
                <div key={order.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium">{order.order_number}</span>
                        <Badge variant="secondary">{order.status}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Stuck for {Math.round((Date.now() - new Date(order.updated_at).getTime()) / (60 * 60 * 1000))} hours • 
                        ${(order.total_amount / 100).toFixed(2)}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => recoverOrder(order.id, 'retry')}
                        disabled={recovering.has(order.id)}
                      >
                        {recovering.has(order.id) ? (
                          <>
                            <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                            Retrying...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-1 h-3 w-3" />
                            Retry
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => recoverOrder(order.id, 'fail')}
                        disabled={recovering.has(order.id)}
                      >
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Mark Failed
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && stuckOrders.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No stuck orders found. Click "Find Stuck Orders" to scan.</p>
            </div>
          )}
        </div>

        {/* Manual Recovery Section */}
        <div className="space-y-4 pt-6 border-t-2 mt-6">
          <div>
            <h3 className="text-lg font-semibold">🎯 Manual Recovery</h3>
            <p className="text-sm text-muted-foreground">
              Enter any order ID or order number to manually trigger recovery (works for all order types)
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="manual-order-id">Order ID or Order Number</Label>
              <div className="flex gap-2">
                <Input
                  id="manual-order-id"
                  placeholder="e.g., ORD-20251117-6327 or order UUID"
                  value={manualOrderId}
                  onChange={(e) => setManualOrderId(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      recoverManualOrder();
                    }
                  }}
                  disabled={recovering.has(manualOrderId)}
                />
                <Button 
                  onClick={recoverManualOrder}
                  disabled={recovering.has(manualOrderId) || !manualOrderId.trim()}
                >
                  {recovering.has(manualOrderId) ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Recover Order'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {stuckOrders.length > 0 && (
          <div className="space-y-3">
            {stuckOrders.map(order => (
              <div key={order.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium">{order.order_number}</span>
                      <Badge variant="secondary">{order.status}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Stuck for {Math.round((Date.now() - new Date(order.updated_at).getTime()) / (60 * 60 * 1000))} hours • 
                      ${(order.total_amount / 100).toFixed(2)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => recoverOrder(order.id, 'retry')}
                      disabled={recovering.has(order.id)}
                    >
                      {recovering.has(order.id) ? (
                        <>
                          <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                          Retrying...
                        </>
                      ) : (
                        'Retry'
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => recoverOrder(order.id, 'fail')}
                      disabled={recovering.has(order.id)}
                    >
                      Mark Failed
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && stuckOrders.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No stuck orders found. Click "Find Stuck Orders" to scan.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderRecoveryTool;
