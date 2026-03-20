import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Wallet, AlertTriangle, CheckCircle2, Calendar, Clock, CreditCard, Truck, ArrowRight, Banknote, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ZMABalanceCard } from "./ZMABalanceCard";
import { TransferCalculator } from "./TransferCalculator";
import { TransferHistory } from "./TransferHistory";
import { InfoTooltip } from "../dashboard/InfoTooltip";
import { format, addDays } from "date-fns";
import { PAYMENT_LEAD_TIME } from "@/lib/constants/paymentLeadTime";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ZMABalanceData {
  balance: number;
  available_funds: number;
  pending_charges: number;
  last_checked_at: string;
  recent_transactions: any[];
}

interface OrderPipelineData {
  scheduled: { count: number; total_value: number };
  paymentConfirmed: { count: number; total_value: number };
  processing: { count: number; total_value: number };
}

interface StripePayout {
  id: string;
  amount: number;
  currency: string;
  status: string;
  arrival_date: string;
  created: string;
  description: string | null;
  method: string;
}

export default function MonthlyFundingDashboard() {
  const [balanceData, setBalanceData] = useState<ZMABalanceData | null>(null);
  const [pipeline, setPipeline] = useState<OrderPipelineData>({
    scheduled: { count: 0, total_value: 0 },
    paymentConfirmed: { count: 0, total_value: 0 },
    processing: { count: 0, total_value: 0 },
  });
  const [payouts, setPayouts] = useState<StripePayout[]>([]);
  const [payoutsLoading, setPayoutsLoading] = useState(false);
  const [totalFeesRetained, setTotalFeesRetained] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [recordingPayoutId, setRecordingPayoutId] = useState<string | null>(null);
  const [recordedPayoutIds, setRecordedPayoutIds] = useState<Set<string>>(new Set());

  const fetchZMABalance = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-zma-accounts');
      if (error) throw error;
      setBalanceData(data);
      setLastRefresh(new Date());
      toast.success('ZMA balance refreshed');
    } catch (error) {
      console.error('Error fetching ZMA balance:', error);
      toast.error('Failed to fetch ZMA balance');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrderPipeline = async () => {
    try {
      const { data: scheduledOrders } = await supabase
        .from('orders')
        .select('id, total_amount')
        .eq('status', 'scheduled')
        .eq('payment_status', 'authorized');

      const { data: confirmedOrders } = await supabase
        .from('orders')
        .select('id, total_amount')
        .eq('status', PAYMENT_LEAD_TIME.PAYMENT_CONFIRMED_STATUS);

      const { data: processingOrders } = await supabase
        .from('orders')
        .select('id, total_amount')
        .eq('status', 'processing');

      setPipeline({
        scheduled: {
          count: scheduledOrders?.length || 0,
          total_value: scheduledOrders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0,
        },
        paymentConfirmed: {
          count: confirmedOrders?.length || 0,
          total_value: confirmedOrders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0,
        },
        processing: {
          count: processingOrders?.length || 0,
          total_value: processingOrders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0,
        },
      });
    } catch (error) {
      console.error('Error fetching order pipeline:', error);
    }
  };

  const fetchStripePayouts = async () => {
    setPayoutsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-stripe-payouts', {
        body: null,
      });
      if (error) throw error;
      setPayouts(data?.payouts || []);
    } catch (error) {
      console.error('Error fetching Stripe payouts:', error);
      toast.error('Failed to fetch Stripe payouts');
    } finally {
      setPayoutsLoading(false);
    }
  };

  const fetchTotalFeesRetained = async () => {
    try {
      // Sum gifting fees from all completed orders
      const { data: orders } = await supabase
        .from('orders')
        .select('line_items')
        .in('status', ['completed', 'shipped', 'delivered']);

      const total = (orders || []).reduce((sum, order) => {
        const li = order.line_items as any;
        if (li && typeof li === 'object' && !Array.isArray(li) && li.gifting_fee !== undefined) {
          return sum + Number(li.gifting_fee);
        }
        return sum;
      }, 0);
      setTotalFeesRetained(total);
    } catch (error) {
      console.error('Error fetching fees:', error);
    }
  };

  const fetchRecordedPayouts = async () => {
    try {
      const { data } = await supabase
        .from('zma_funding_schedule')
        .select('stripe_payout_id')
        .not('stripe_payout_id', 'is', null);

      const ids = new Set((data || []).map(d => d.stripe_payout_id).filter(Boolean) as string[]);
      setRecordedPayoutIds(ids);
    } catch (error) {
      console.error('Error fetching recorded payouts:', error);
    }
  };

  const recordTransfer = async (payout: StripePayout, netAmount: number) => {
    setRecordingPayoutId(payout.id);
    try {
      const feeForPayout = estimateFeeForPayout(payout.amount);
      const { error } = await supabase
        .from('zma_funding_schedule')
        .insert({
          stripe_payout_id: payout.id,
          expected_payout_amount: payout.amount,
          expected_payout_date: payout.arrival_date,
          transfer_amount: netAmount,
          transferred_to_zinc: false,
          notes: `Stripe payout ${payout.id}. Payout: $${payout.amount.toFixed(2)}, Fees retained: ~$${feeForPayout.toFixed(2)}, Net to ZMA: $${netAmount.toFixed(2)}`,
        });

      if (error) throw error;
      toast.success(`Transfer recorded for payout ${payout.id.slice(-6)}`);
      setRecordedPayoutIds(prev => new Set([...prev, payout.id]));
      fetchRecordedPayouts();
    } catch (error) {
      console.error('Error recording transfer:', error);
      toast.error('Failed to record transfer');
    } finally {
      setRecordingPayoutId(null);
    }
  };

  const fetchCachedBalance = async () => {
    try {
      const { data, error } = await supabase
        .from('zma_accounts')
        .select('*')
        .limit(1)
        .single();

      if (data && !error) {
        setBalanceData({
          balance: data.account_balance || 0,
          available_funds: data.account_balance || 0,
          pending_charges: 0,
          last_checked_at: data.last_balance_check || data.updated_at,
          recent_transactions: [],
        });
      }
    } catch (error) {
      console.error('Error fetching cached balance:', error);
    }
  };

  useEffect(() => {
    fetchCachedBalance();
    fetchOrderPipeline();
    fetchStripePayouts();
    fetchTotalFeesRetained();
    fetchRecordedPayouts();
  }, []);

  // Estimate the Elyphant fee portion of a payout
  // Based on the ratio of total fees to total GMV from completed orders
  const estimateFeeForPayout = useCallback((payoutAmount: number): number => {
    const totalPaidOut = payouts
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
    
    if (totalPaidOut <= 0) return 0;
    const feeRatio = totalFeesRetained / totalPaidOut;
    return payoutAmount * feeRatio;
  }, [payouts, totalFeesRetained]);

  // Total pending ZMA requirement
  const pendingZMARequirement = pipeline.paymentConfirmed.total_value + pipeline.processing.total_value;
  const totalPendingCount = pipeline.paymentConfirmed.count + pipeline.processing.count;

  // Sum of untransferred payouts minus retained fees
  const untransferredPayouts = payouts.filter(p => p.status === 'paid' && !recordedPayoutIds.has(p.id));
  const untransferredTotal = untransferredPayouts.reduce((sum, p) => sum + p.amount, 0);
  const untransferredNetTotal = untransferredPayouts.reduce((sum, p) => {
    const fee = estimateFeeForPayout(p.amount);
    return sum + Math.max(0, p.amount - fee);
  }, 0);

  const recommendedTransfer = Math.max(
    0,
    (pendingZMARequirement + PAYMENT_LEAD_TIME.ZMA_BUFFER_AMOUNT) - (balanceData?.balance || 0)
  );

  const balanceStatus = (balanceData?.balance || 0) >= (pendingZMARequirement + 200)
    ? 'sufficient'
    : (balanceData?.balance || 0) >= pendingZMARequirement
    ? 'low'
    : 'critical';

  const today = new Date();
  const expectedPayoutDate = addDays(today, PAYMENT_LEAD_TIME.STRIPE_PAYOUT_DAYS);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Wallet className="h-6 w-6" />
            ZMA Funding Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Stripe → Chase → PayPal → Zinc funding pipeline
          </p>
        </div>
        <Button
          onClick={() => { fetchZMABalance(); fetchOrderPipeline(); fetchStripePayouts(); fetchTotalFeesRetained(); }}
          disabled={isLoading || payoutsLoading}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${(isLoading || payoutsLoading) ? 'animate-spin' : ''}`} />
          Refresh All
        </Button>
      </div>

      {/* Alert Banner */}
      {balanceStatus === 'critical' && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <div>
            <p className="font-medium text-destructive">Low ZMA Balance Alert</p>
            <p className="text-sm text-muted-foreground">
              Current balance (${balanceData?.balance?.toFixed(2) || '0.00'}) is below pending orders value (${pendingZMARequirement.toFixed(2)}). Transfer funds immediately.
            </p>
          </div>
        </div>
      )}

      {/* Order Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Order Processing Pipeline
            <InfoTooltip content="Three-stage pipeline: Scheduled (payment authorized, not captured), Payment Confirmed (captured, awaiting Stripe payout to Chase), Processing (submitted to Zinc, ZMA funds used)." />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border border-border bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Scheduled</span>
              </div>
              <div className="text-2xl font-bold">{pipeline.scheduled.count}</div>
              <p className="text-sm text-muted-foreground">${pipeline.scheduled.total_value.toFixed(2)} awaiting capture</p>
            </div>
            <div className="p-4 rounded-lg border border-primary/30 bg-primary/5">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Payment Confirmed</span>
              </div>
              <div className="text-2xl font-bold text-primary">{pipeline.paymentConfirmed.count}</div>
              <p className="text-sm text-muted-foreground">${pipeline.paymentConfirmed.total_value.toFixed(2)} captured</p>
              <p className="text-xs text-muted-foreground mt-1">Stripe payout ~{format(expectedPayoutDate, 'MMM d')}</p>
            </div>
            <div className="p-4 rounded-lg border border-green-500/30 bg-green-500/5">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">Processing</span>
              </div>
              <div className="text-2xl font-bold text-green-600">{pipeline.processing.count}</div>
              <p className="text-sm text-muted-foreground">${pipeline.processing.total_value.toFixed(2)} with Zinc</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ZMABalanceCard
          balance={balanceData?.balance || 0}
          lastChecked={balanceData?.last_checked_at}
          status={balanceStatus}
          isLoading={isLoading}
        />
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Untransferred Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{untransferredPayouts.length}</div>
            <p className="text-sm text-muted-foreground">
              ${untransferredTotal.toFixed(2)} total → ~${untransferredNetTotal.toFixed(2)} net to ZMA
            </p>
          </CardContent>
        </Card>
        <Card className={recommendedTransfer > 0 ? 'border-primary' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Transfer Recommended</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${recommendedTransfer > 0 ? 'text-primary' : 'text-green-600'}`}>
              ${recommendedTransfer.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground">
              {recommendedTransfer > 0 ? `To maintain $${PAYMENT_LEAD_TIME.ZMA_BUFFER_AMOUNT} buffer` : 'Balance is sufficient'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stripe Payouts → ZMA Transfer Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Stripe Payouts → ZMA Transfers
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Total Elyphant fees retained across all completed orders: <strong className="text-foreground">${totalFeesRetained.toFixed(2)}</strong>
          </p>
        </CardHeader>
        <CardContent>
          {payoutsLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin mr-2" /> Loading payouts...
            </div>
          ) : payouts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No Stripe payouts found</p>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Payout ID</TableHead>
                    <TableHead className="text-right">Payout Amount</TableHead>
                    <TableHead className="text-right">Fees Retained</TableHead>
                    <TableHead className="text-right">Net to ZMA</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map((payout) => {
                    const feeEstimate = estimateFeeForPayout(payout.amount);
                    const netToZMA = Math.max(0, payout.amount - feeEstimate);
                    const isRecorded = recordedPayoutIds.has(payout.id);

                    return (
                      <TableRow key={payout.id}>
                        <TableCell className="text-sm">
                          {format(new Date(payout.arrival_date), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          ...{payout.id.slice(-8)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${payout.amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-green-600 font-medium">
                          -${feeEstimate.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          ${netToZMA.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            payout.status === 'paid' ? 'default' :
                            payout.status === 'in_transit' ? 'secondary' :
                            'outline'
                          }>
                            {payout.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {isRecorded ? (
                            <Badge variant="outline" className="text-green-600 border-green-200">
                              <Check className="h-3 w-3 mr-1" /> Recorded
                            </Badge>
                          ) : payout.status === 'paid' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => recordTransfer(payout, netToZMA)}
                              disabled={recordingPayoutId === payout.id}
                            >
                              {recordingPayoutId === payout.id ? (
                                <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                              ) : (
                                <ArrowRight className="h-3 w-3 mr-1" />
                              )}
                              Record
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">Pending</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transfer Calculator */}
      <TransferCalculator
        pendingOrdersValue={pendingZMARequirement}
        bufferAmount={PAYMENT_LEAD_TIME.ZMA_BUFFER_AMOUNT}
        currentBalance={balanceData?.balance || 0}
        recommendedTransfer={recommendedTransfer}
        untransferredNetTotal={untransferredNetTotal}
      />

      {/* Transfer History */}
      <TransferHistory onTransferRecorded={fetchZMABalance} />
    </div>
  );
}
