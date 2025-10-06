import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DollarSign, AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface FundingStatus {
  currentBalance: number;
  pendingOrdersValue: number;
  ordersWaiting: number;
  shortfall: number;
  recommendedTransfer: number;
  nextExpectedPayout?: {
    date: string;
    amount: number;
  };
}

interface FundingAlert {
  id: string;
  alert_type: string;
  zma_current_balance: number;
  pending_orders_value: number;
  recommended_transfer_amount: number;
  orders_count_waiting: number;
  alert_sent_at: string;
  resolved_at: string | null;
}

export const ZMAFundingDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [fundingStatus, setFundingStatus] = useState<FundingStatus | null>(null);
  const [recentAlerts, setRecentAlerts] = useState<FundingAlert[]>([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNotes, setTransferNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchFundingStatus = async () => {
    try {
      setLoading(true);

      // Get ZMA balance
      const { data: balanceData, error: balanceError } = await supabase.functions.invoke('manage-zma-accounts', {
        body: { action: 'checkBalance' }
      });

      if (balanceError) throw balanceError;

      const currentBalance = balanceData?.balance || 0;

      // Get orders awaiting funding
      const { data: awaitingOrders, error: ordersError } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('funding_status', 'awaiting_funds');

      if (ordersError) throw ordersError;

      const pendingValue = awaitingOrders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
      const ordersCount = awaitingOrders?.length || 0;
      const shortfall = Math.max(0, pendingValue - currentBalance);
      const recommendedTransfer = shortfall > 0 ? Math.ceil(shortfall * 1.1) : 0; // Add 10% buffer

      setFundingStatus({
        currentBalance,
        pendingOrdersValue: pendingValue,
        ordersWaiting: ordersCount,
        shortfall,
        recommendedTransfer
      });

      // Get recent funding alerts
      const { data: alerts } = await supabase
        .from('zma_funding_alerts')
        .select('*')
        .order('alert_sent_at', { ascending: false })
        .limit(5);

      setRecentAlerts(alerts || []);

    } catch (error: any) {
      console.error('Failed to fetch funding status:', error);
      toast.error('Failed to load funding status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFundingStatus();
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchFundingStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleConfirmTransfer = async () => {
    if (!transferAmount || parseFloat(transferAmount) <= 0) {
      toast.error('Please enter a valid transfer amount');
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Record the funding event
      const { error: insertError } = await supabase
        .from('zma_funding_schedule')
        .insert({
          transfer_date: new Date().toISOString(),
          transfer_amount: parseFloat(transferAmount),
          admin_confirmed_by: user.id,
          zma_balance_before: fundingStatus?.currentBalance || 0,
          transferred_to_zinc: true,
          notes: transferNotes || 'Manual transfer confirmed via dashboard'
        });

      if (insertError) throw insertError;

      // Resolve open alerts
      await supabase
        .from('zma_funding_alerts')
        .update({ 
          resolved_at: new Date().toISOString(),
          resolved_by: user.id
        })
        .is('resolved_at', null);

      // Trigger funding status check to process queued orders
      await supabase.functions.invoke('check-zma-funding-status', {
        body: { manualTrigger: true }
      });

      toast.success('Funding confirmed! Processing queued orders...');
      setConfirmDialogOpen(false);
      setTransferAmount('');
      setTransferNotes('');
      
      // Refresh status after 2 seconds
      setTimeout(fetchFundingStatus, 2000);

    } catch (error: any) {
      console.error('Failed to confirm transfer:', error);
      toast.error('Failed to confirm transfer');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = () => {
    if (!fundingStatus) return 'text-muted-foreground';
    if (fundingStatus.shortfall === 0) return 'text-green-600';
    if (fundingStatus.shortfall > fundingStatus.currentBalance) return 'text-destructive';
    return 'text-yellow-600';
  };

  const getStatusIcon = () => {
    if (!fundingStatus) return <Clock className="h-5 w-5" />;
    if (fundingStatus.shortfall === 0) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (fundingStatus.shortfall > fundingStatus.currentBalance) return <AlertTriangle className="h-5 w-5 text-destructive" />;
    return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ZMA Funding Status</CardTitle>
          <CardDescription>Loading funding information...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <CardTitle>ZMA Funding Status</CardTitle>
            </div>
            <Button onClick={fetchFundingStatus} variant="outline" size="sm">
              Refresh
            </Button>
          </div>
          <CardDescription>
            Monitor your ZMA balance and pending order funding
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {fundingStatus && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 p-4 border rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span>Current ZMA Balance</span>
                  </div>
                  <div className="text-2xl font-bold">
                    ${fundingStatus.currentBalance.toFixed(2)}
                  </div>
                </div>

                <div className="space-y-2 p-4 border rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <span>Pending Orders</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {fundingStatus.ordersWaiting} orders · ${fundingStatus.pendingOrdersValue.toFixed(2)}
                  </div>
                </div>
              </div>

              {fundingStatus.shortfall > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-semibold mb-2">
                      Funding Required: ${fundingStatus.shortfall.toFixed(2)} shortfall
                    </div>
                    <div className="text-sm mb-3">
                      Transfer <strong>${fundingStatus.recommendedTransfer.toFixed(2)}</strong> to Zinc via PayPal to process {fundingStatus.ordersWaiting} pending {fundingStatus.ordersWaiting === 1 ? 'order' : 'orders'}.
                    </div>
                    <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm"
                          onClick={() => setTransferAmount(fundingStatus.recommendedTransfer.toString())}
                        >
                          I've Transferred Funds
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Confirm Fund Transfer</DialogTitle>
                          <DialogDescription>
                            Confirm that you've transferred funds from your bank to Zinc via PayPal
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="amount">Transfer Amount ($)</Label>
                            <Input
                              id="amount"
                              type="number"
                              step="0.01"
                              value={transferAmount}
                              onChange={(e) => setTransferAmount(e.target.value)}
                              placeholder="Enter amount transferred"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="notes">Notes (Optional)</Label>
                            <Textarea
                              id="notes"
                              value={transferNotes}
                              onChange={(e) => setTransferNotes(e.target.value)}
                              placeholder="Any additional notes about this transfer..."
                            />
                          </div>
                          <Button 
                            onClick={handleConfirmTransfer} 
                            disabled={submitting}
                            className="w-full"
                          >
                            {submitting ? 'Confirming...' : 'Confirm Transfer'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </AlertDescription>
                </Alert>
              )}

              {fundingStatus.shortfall === 0 && fundingStatus.ordersWaiting === 0 && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    All systems operational. No orders awaiting funding.
                  </AlertDescription>
                </Alert>
              )}

              {fundingStatus.shortfall === 0 && fundingStatus.ordersWaiting > 0 && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Sufficient balance to process all pending orders.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {recentAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Funding Alerts</CardTitle>
            <CardDescription>History of funding notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 border rounded-lg ${alert.resolved_at ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">
                        ${alert.recommended_transfer_amount.toFixed(2)} needed for {alert.orders_count_waiting} orders
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(alert.alert_sent_at).toLocaleString()}
                      </div>
                    </div>
                    {alert.resolved_at && (
                      <div className="text-sm text-green-600 font-medium">
                        ✓ Resolved
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
