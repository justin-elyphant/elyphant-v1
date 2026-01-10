import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Wallet, AlertTriangle, CheckCircle2, Calendar, Clock, CreditCard, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ZMABalanceCard } from "./ZMABalanceCard";
import { TransferCalculator } from "./TransferCalculator";
import { TransferHistory } from "./TransferHistory";
import { format, addDays } from "date-fns";
import { PAYMENT_LEAD_TIME } from "@/lib/constants/paymentLeadTime";

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

export default function FridayTransferDashboard() {
  const [balanceData, setBalanceData] = useState<ZMABalanceData | null>(null);
  const [pipeline, setPipeline] = useState<OrderPipelineData>({
    scheduled: { count: 0, total_value: 0 },
    paymentConfirmed: { count: 0, total_value: 0 },
    processing: { count: 0, total_value: 0 },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

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
      // Fetch scheduled orders (payment not yet captured)
      const { data: scheduledOrders } = await supabase
        .from('orders')
        .select('id, total_amount')
        .eq('status', 'scheduled')
        .eq('payment_status', 'authorized');

      // Fetch payment_confirmed orders (awaiting Stripe payout)
      const { data: confirmedOrders } = await supabase
        .from('orders')
        .select('id, total_amount')
        .eq('status', PAYMENT_LEAD_TIME.PAYMENT_CONFIRMED_STATUS);

      // Fetch processing orders (submitted to Zinc)
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
  }, []);

  // Total pending ZMA requirement = payment_confirmed + processing orders
  const pendingZMARequirement = pipeline.paymentConfirmed.total_value + pipeline.processing.total_value;
  const totalPendingCount = pipeline.paymentConfirmed.count + pipeline.processing.count;

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
  const dayOfMonth = today.getDate();
  const isTransferDay = dayOfMonth >= 1 && dayOfMonth <= 5; // First 5 days of month

  // Expected Stripe payout date
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
            Monthly funding cycle with ${PAYMENT_LEAD_TIME.ZMA_BUFFER_AMOUNT} buffer
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isTransferDay && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
              <Calendar className="h-4 w-4" />
              Monthly Transfer Window (1st-5th)
            </div>
          )}
          <Button
            onClick={() => { fetchZMABalance(); fetchOrderPipeline(); }}
            disabled={isLoading}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
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

      {/* Two-Stage Pipeline Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Order Processing Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Stage 1: Scheduled (awaiting payment capture) */}
            <div className="p-4 rounded-lg border border-border bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Scheduled</span>
              </div>
              <div className="text-2xl font-bold">{pipeline.scheduled.count}</div>
              <p className="text-sm text-muted-foreground">
                ${pipeline.scheduled.total_value.toFixed(2)} awaiting capture
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Payment held, captured {PAYMENT_LEAD_TIME.CAPTURE_LEAD_DAYS} days before delivery
              </p>
            </div>

            {/* Stage 2: Payment Confirmed (awaiting Stripe payout) */}
            <div className="p-4 rounded-lg border border-primary/30 bg-primary/5">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Payment Confirmed</span>
              </div>
              <div className="text-2xl font-bold text-primary">{pipeline.paymentConfirmed.count}</div>
              <p className="text-sm text-muted-foreground">
                ${pipeline.paymentConfirmed.total_value.toFixed(2)} captured
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Stripe payout ~{format(expectedPayoutDate, 'MMM d')}
              </p>
            </div>

            {/* Stage 3: Processing (submitted to Zinc) */}
            <div className="p-4 rounded-lg border border-green-500/30 bg-green-500/5">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">Processing</span>
              </div>
              <div className="text-2xl font-bold text-green-600">{pipeline.processing.count}</div>
              <p className="text-sm text-muted-foreground">
                ${pipeline.processing.total_value.toFixed(2)} with Zinc
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Submitted to Zinc, ZMA funds used
              </p>
            </div>
          </div>

          {/* Flow arrows on desktop */}
          <div className="hidden md:flex justify-center items-center gap-2 mt-4 text-muted-foreground text-sm">
            <span>Scheduled</span>
            <span>→</span>
            <span className="text-primary">Payment Captured ({PAYMENT_LEAD_TIME.CAPTURE_LEAD_DAYS} days early)</span>
            <span>→</span>
            <span>Stripe Payout (~{PAYMENT_LEAD_TIME.STRIPE_PAYOUT_DAYS} days)</span>
            <span>→</span>
            <span className="text-green-600">Zinc Submission</span>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending ZMA Requirement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPendingCount}</div>
            <p className="text-sm text-muted-foreground">
              Total: ${pendingZMARequirement.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {PAYMENT_LEAD_TIME.PAYMENT_CONFIRMED_STATUS} + processing
            </p>
          </CardContent>
        </Card>

        <Card className={recommendedTransfer > 0 ? 'border-primary' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Transfer Recommended
            </CardTitle>
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

      {/* Transfer Calculator */}
      <TransferCalculator
        pendingOrdersValue={pendingZMARequirement}
        bufferAmount={PAYMENT_LEAD_TIME.ZMA_BUFFER_AMOUNT}
        currentBalance={balanceData?.balance || 0}
        recommendedTransfer={recommendedTransfer}
      />

      {/* Monthly Funding Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Monthly Funding Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <ChecklistItem
              checked={balanceData !== null && lastRefresh !== null}
              label="Check current ZMA balance (click Refresh)"
            />
            <ChecklistItem
              checked={pipeline.paymentConfirmed.count >= 0}
              label="Review Stripe revenue in Chase bank account"
            />
            <ChecklistItem
              checked={pipeline.processing.count >= 0}
              label="Check pending orders requiring ZMA funds"
            />
            <ChecklistItem
              checked={false}
              label="Calculate monthly transfer amount needed"
            />
            <ChecklistItem
              checked={false}
              label="Transfer via PayPal to Zinc (by 5th of month)"
            />
            <ChecklistItem
              checked={false}
              label="Record transfer in system (use button below)"
            />
          </div>
        </CardContent>
      </Card>

      {/* Transfer History */}
      <TransferHistory onTransferRecorded={fetchZMABalance} />
    </div>
  );
}

function ChecklistItem({ checked, label }: { checked: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`h-5 w-5 rounded-full flex items-center justify-center ${
        checked ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'
      }`}>
        {checked ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="text-xs">○</span>}
      </div>
      <span className={checked ? 'text-muted-foreground line-through' : 'text-foreground'}>
        {label}
      </span>
    </div>
  );
}
