
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, CheckCircle2, XCircle, RefreshCw, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { unifiedPaymentVerificationService } from '@/services/payment/UnifiedPaymentVerificationService';

interface StuckOrder {
  id: string;
  order_number: string;
  zinc_order_id: string;
  status: string;
  created_at: string;
  hoursStuck: number;
}

interface PaymentVerificationOrder {
  id: string;
  order_number: string;
  checkout_session_id: string;
  payment_intent_id: string;
  payment_status: string;
  status: string;
  created_at: string;
  minutesStuck: number;
}

const OrderMonitoring: React.FC = () => {
  const [stuckOrders, setStuckOrders] = useState<StuckOrder[]>([]);
  const [paymentVerificationOrders, setPaymentVerificationOrders] = useState<PaymentVerificationOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stuck' | 'payment'>('stuck');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [isBulkVerifying, setIsBulkVerifying] = useState(false);

  const fetchPaymentVerificationOrders = async () => {
    try {
      // Get orders stuck in payment verification for more than 10 minutes
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, checkout_session_id, payment_intent_id, payment_status, status, created_at')
        .eq('payment_status', 'payment_verification_failed')
        .lt('created_at', tenMinutesAgo)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payment verification orders:', error);
        return;
      }

      const ordersWithMinutes: PaymentVerificationOrder[] = (data || []).map(order => ({
        id: order.id,
        order_number: order.order_number,
        checkout_session_id: order.checkout_session_id,
        payment_intent_id: order.payment_intent_id || '',
        payment_status: order.payment_status,
        status: order.status,
        created_at: order.created_at,
        minutesStuck: Math.floor((Date.now() - new Date(order.created_at).getTime()) / (1000 * 60))
      }));

      setPaymentVerificationOrders(ordersWithMinutes);
    } catch (error) {
      console.error('Error fetching payment verification orders:', error);
    }
  };

  const fetchStuckOrders = async () => {
    try {
      // Get orders that are stuck in processing/placed status for more than 6 hours
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, zinc_order_id, status, created_at')
        .eq('status', 'processing')
        .lt('created_at', sixHoursAgo)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching stuck orders:', error);
        return;
      }

      const ordersWithHours: StuckOrder[] = (data || []).map(order => ({
        ...order,
        hoursStuck: Math.floor((Date.now() - new Date(order.created_at).getTime()) / (1000 * 60 * 60))
      }));

      setStuckOrders(ordersWithHours);
    } catch (error) {
      console.error('Error fetching stuck orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshStuckOrders = async () => {
    if (stuckOrders.length === 0) return;
    
    const zincOrderIds = stuckOrders
      .filter(order => order.zinc_order_id)
      .map(order => order.zinc_order_id);

    if (zincOrderIds.length === 0) return;

    try {
      console.log('Refreshing stuck orders:', zincOrderIds);
      
      const { data, error } = await supabase.functions.invoke('check-zinc-order-status', {
        body: {
          orderIds: zincOrderIds
        }
      });

      if (error) {
        throw error;
      }

      const results = data.results || [];
      const successCount = results.filter((r: any) => r.updated).length;
      
      if (successCount > 0) {
        toast.success(`Updated ${successCount} stuck order(s)`);
        await fetchStuckOrders(); // Refresh the list
      } else {
        toast.info('No updates available for stuck orders');
      }

    } catch (error) {
      console.error('Error refreshing stuck orders:', error);
      toast.error('Failed to refresh stuck orders');
    }
  };

  const getStatusBadgeVariant = (hoursStuck: number) => {
    if (hoursStuck < 12) return 'secondary';
    if (hoursStuck < 24) return 'destructive';
    return 'destructive';
  };

  const getStatusIcon = (hoursStuck: number) => {
    if (hoursStuck < 12) return <Clock className="h-4 w-4" />;
    if (hoursStuck < 24) return <AlertTriangle className="h-4 w-4" />;
    return <XCircle className="h-4 w-4" />;
  };

  const bulkVerifyPayments = async () => {
    if (paymentVerificationOrders.length === 0) return;

    setIsBulkVerifying(true);
    try {
      const ordersToVerify = paymentVerificationOrders.map(order => ({
        id: order.id,
          sessionId: order.checkout_session_id,
          paymentIntentId: order.payment_intent_id
      }));

      console.log('Starting bulk payment verification for', ordersToVerify.length, 'orders');
      
      const results = await unifiedPaymentVerificationService.bulkVerification(ordersToVerify);
      
      const successCount = results.filter(r => r.result.success && r.result.payment_status === 'succeeded').length;
      const pendingCount = results.filter(r => r.result.payment_status === 'pending').length;
      
      if (successCount > 0) {
        toast.success(`Successfully verified ${successCount} payment(s)`);
      }
      if (pendingCount > 0) {
        toast.info(`${pendingCount} payment(s) still pending verification`);
      }
      if (successCount === 0 && pendingCount === 0) {
        toast.error('No payments could be verified. They may still be processing.');
      }

      // Refresh the lists
      await Promise.all([fetchStuckOrders(), fetchPaymentVerificationOrders()]);
      
    } catch (error) {
      console.error('Error in bulk payment verification:', error);
      toast.error('Failed to verify payments');
    } finally {
      setIsBulkVerifying(false);
    }
  };

  useEffect(() => {
    fetchStuckOrders();
    fetchPaymentVerificationOrders();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchStuckOrders();
        fetchPaymentVerificationOrders();
      }, 5 * 60 * 1000); // Check every 5 minutes
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Order Monitoring
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
              Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
            </Button>
            {activeTab === 'stuck' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={refreshStuckOrders}
                disabled={stuckOrders.length === 0}
              >
                Refresh Stuck Orders
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={bulkVerifyPayments}
                disabled={paymentVerificationOrders.length === 0 || isBulkVerifying}
              >
                <CreditCard className="h-4 w-4 mr-1" />
                {isBulkVerifying ? 'Verifying...' : 'Bulk Verify Payments'}
              </Button>
            )}
          </div>
        </div>
        <div className="flex space-x-1 mt-4">
          <Button
            variant={activeTab === 'stuck' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('stuck')}
          >
            <Clock className="h-4 w-4 mr-1" />
            Stuck Orders ({stuckOrders.length})
          </Button>
          <Button
            variant={activeTab === 'payment' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('payment')}
          >
            <CreditCard className="h-4 w-4 mr-1" />
            Payment Verification ({paymentVerificationOrders.length})
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center text-muted-foreground">Loading...</p>
        ) : activeTab === 'stuck' ? (
          stuckOrders.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-2" />
              <p className="text-muted-foreground">No stuck orders found</p>
              <p className="text-sm text-muted-foreground">All orders are processing normally</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">
                Found {stuckOrders.length} order(s) stuck for more than 6 hours
              </p>
              {stuckOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(order.hoursStuck)}
                    <div>
                      <p className="font-medium">{order.order_number}</p>
                      <p className="text-sm text-muted-foreground">
                        Zinc ID: {order.zinc_order_id || 'N/A'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Status: {order.status}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={getStatusBadgeVariant(order.hoursStuck)}>
                      {order.hoursStuck}h stuck
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      Since {new Date(order.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          paymentVerificationOrders.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-2" />
              <p className="text-muted-foreground">No payment verification issues</p>
              <p className="text-sm text-muted-foreground">All payments are processing normally</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">
                Found {paymentVerificationOrders.length} payment(s) stuck in verification for more than 10 minutes
              </p>
              {paymentVerificationOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-4 w-4 text-amber-500" />
                    <div>
                      <p className="font-medium">{order.order_number}</p>
                      <p className="text-sm text-muted-foreground">
                        Session: {order.checkout_session_id?.slice(-8) || 'N/A'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Status: {order.status} / Payment: {order.payment_status}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive">
                      {order.minutesStuck}m stuck
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      Since {new Date(order.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>{activeTab === 'stuck' ? 'Monitoring Rules:' : 'Payment Verification Rules:'}</strong>
          </p>
          {activeTab === 'stuck' ? (
            <ul className="text-xs text-amber-700 mt-1 space-y-1">
              <li>• Orders stuck 6-12h: Normal processing time</li>
              <li>• Orders stuck 12-24h: Needs attention</li>
              <li>• Orders stuck 24h+: Likely requires manual intervention</li>
            </ul>
          ) : (
            <ul className="text-xs text-amber-700 mt-1 space-y-1">
              <li>• Payments stuck 10+ min: Likely webhook delay or Stripe API issue</li>
              <li>• Use bulk verify to retry verification for all stuck payments</li>
              <li>• Orders remain in cart until payment verified</li>
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderMonitoring;
