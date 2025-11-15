import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertTriangle, RefreshCw, Search, Zap, ExternalLink } from 'lucide-react';

interface WebhookFailureOrder {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  stripe_payment_intent_id: string | null;
  total_amount: number;
  created_at: string;
  updated_at: string;
  zinc_order_id: string | null;
  customer_email: string;
}

interface WebhookRecoveryPanelProps {
  onOrderRecovered?: (orderId: string) => void;
}

const WebhookRecoveryPanel: React.FC<WebhookRecoveryPanelProps> = ({ onOrderRecovered }) => {
  const [stuckOrders, setStuckOrders] = useState<WebhookFailureOrder[]>([]);
  const [specificOrderId, setSpecificOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState<Set<string>>(new Set());

  const fetchStuckOrders = async () => {
    setLoading(true);
    try {
      // Find orders that are likely stuck due to webhook failures
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, 
          order_number, 
          status, 
          payment_status, 
          payment_intent_id,
          total_amount,
          created_at,
          updated_at,
          zinc_order_id,
          user_id
        `)
        .in('status', ['payment_confirmed', 'pending'])
        .eq('payment_status', 'succeeded')
        .is('zinc_order_id', null)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const formattedOrders = (data || []).map(order => ({
        ...order,
        customer_email: order.user_id || 'Unknown',
        stripe_payment_intent_id: order.payment_intent_id // Map to old field name for compatibility
      }));

      setStuckOrders(formattedOrders);
    } catch (error) {
      console.error('Error fetching stuck orders:', error);
      toast.error('Failed to fetch webhook failure orders');
    } finally {
      setLoading(false);
    }
  };

  const triggerOrderOrchestrator = async (orderId: string, source: 'manual_recovery' | 'webhook_recovery' = 'webhook_recovery') => {
    if (processing.has(orderId)) return;

    setProcessing(prev => new Set(prev).add(orderId));
    
    try {
      console.log(`🚀 Triggering order processing for ${orderId} from ${source}`);
      
      const { data, error } = await supabase.functions.invoke('process-zma-order', {
        body: {
          orderId,
          triggerSource: source,
          metadata: {
            recoveryType: 'webhook_failure',
            triggeredAt: new Date().toISOString(),
            originalStatus: stuckOrders.find(o => o.id === orderId)?.status
          }
        }
      });

      // Handle both explicit errors and non-2xx responses
      if (error) {
        console.error(`Edge function error for order ${orderId}:`, error);
        
        // Check if this is just a status code issue but the order was actually processed
        if (error.message?.includes('non-2xx status code')) {
          // Wait a moment and check if the order status changed
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Refresh stuck orders to see if this one was processed
          await fetchStuckOrders();
          
          // Check if the order is no longer stuck
          const isStillStuck = stuckOrders.some(o => o.id === orderId);
          
          if (!isStillStuck) {
            toast.success(`Order ${orderId} was processed successfully!`, {
              description: 'The order was recovered despite the status code error'
            });
            onOrderRecovered?.(orderId);
            return;
          }
        }
        
        throw error;
      }

      // Success case
      if (data?.success || data?.message) {
        toast.success(`Order ${orderId} processing triggered successfully!`, {
          description: data.message || `Order orchestrator invoked with trigger source: ${source}`
        });
        onOrderRecovered?.(orderId);
        await fetchStuckOrders(); // Refresh the list
      } else {
        toast.error(`Failed to trigger processing for order ${orderId}`, {
          description: data?.error || 'Unknown error'
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to trigger orchestrator for order ${orderId}:`, error);
      toast.error(`Recovery failed: ${errorMessage}`);
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const triggerSpecificOrder = async () => {
    if (!specificOrderId.trim()) {
      toast.error('Please enter an order ID');
      return;
    }

    const orderId = specificOrderId.trim();
    await triggerOrderOrchestrator(orderId, 'manual_recovery');
    setSpecificOrderId(''); // Clear input after trigger
  };

  useEffect(() => {
    fetchStuckOrders();
  }, []);

  const getTimeSinceCreated = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours % 24}h ago`;
    }
    return `${diffHours}h ago`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Webhook Failure Recovery
            </CardTitle>
            <CardDescription>
              Orders with successful payments that may have missed webhook processing
            </CardDescription>
          </div>
          <Button onClick={fetchStuckOrders} disabled={loading} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Manual Order Recovery */}
        <div className="border rounded-lg p-4 bg-blue-50">
          <h3 className="font-medium mb-2 flex items-center gap-2">
            <Zap className="h-4 w-4 text-blue-600" />
            Manual Order Recovery
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            Trigger order processing for a specific order ID (like: 40175959-7c4e-498f-92df-f6cd5bf38d28)
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="Enter order ID..."
              value={specificOrderId}
              onChange={(e) => setSpecificOrderId(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={triggerSpecificOrder}
              disabled={!specificOrderId.trim() || processing.has(specificOrderId)}
            >
              {processing.has(specificOrderId) ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Trigger
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Automatic Detection */}
        <div>
          <h3 className="font-medium mb-3">Detected Webhook Failures ({stuckOrders.length})</h3>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : stuckOrders.length === 0 ? (
            <div className="text-center py-6 border rounded-lg bg-green-50">
              <Zap className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-green-700 font-medium">No webhook failures detected</p>
              <p className="text-sm text-green-600">All recent orders processed successfully</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stuckOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 rounded-lg border bg-red-50 border-red-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{order.order_number}</span>
                        <Badge variant="destructive">{order.status}</Badge>
                        <Badge variant="outline" className="text-green-700 bg-green-100">
                          Payment: {order.payment_status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Amount:</span>
                          <p className="font-medium">${order.total_amount}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Customer:</span>
                          <p className="font-medium">{order.customer_email}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Created:</span>
                          <p className="font-medium">{getTimeSinceCreated(order.created_at)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Order ID:</span>
                          <p className="font-mono text-xs">{order.id}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-4 space-y-2">
                      <Button
                        onClick={() => triggerOrderOrchestrator(order.id)}
                        disabled={processing.has(order.id)}
                        size="sm"
                        className="w-full"
                      >
                        {processing.has(order.id) ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Zap className="h-4 w-4 mr-2" />
                            Recover Order
                          </>
                        )}
                      </Button>
                      
                      {order.stripe_payment_intent_id && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => window.open(`https://dashboard.stripe.com/payments/${order.stripe_payment_intent_id}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View in Stripe
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WebhookRecoveryPanel;