import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Wallet, AlertTriangle, CheckCircle2, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ZMABalanceCard } from "./ZMABalanceCard";
import { TransferCalculator } from "./TransferCalculator";
import { TransferHistory } from "./TransferHistory";
import { format } from "date-fns";

interface ZMABalanceData {
  balance: number;
  available_funds: number;
  pending_charges: number;
  last_checked_at: string;
  recent_transactions: any[];
}

interface PendingOrdersData {
  count: number;
  total_value: number;
}

export default function FridayTransferDashboard() {
  const [balanceData, setBalanceData] = useState<ZMABalanceData | null>(null);
  const [pendingOrders, setPendingOrders] = useState<PendingOrdersData>({ count: 0, total_value: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const BUFFER_AMOUNT = 500;

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

  const fetchPendingOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, total_amount')
        .in('status', ['processing', 'payment_confirmed', 'pending']);

      if (error) throw error;

      const totalValue = data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      setPendingOrders({
        count: data?.length || 0,
        total_value: totalValue,
      });
    } catch (error) {
      console.error('Error fetching pending orders:', error);
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
    fetchPendingOrders();
  }, []);

  const recommendedTransfer = Math.max(
    0,
    (pendingOrders.total_value + BUFFER_AMOUNT) - (balanceData?.balance || 0)
  );

  const balanceStatus = (balanceData?.balance || 0) >= (pendingOrders.total_value + 200)
    ? 'sufficient'
    : (balanceData?.balance || 0) >= pendingOrders.total_value
    ? 'low'
    : 'critical';

  const today = new Date();
  const isFriday = today.getDay() === 5;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Wallet className="h-6 w-6" />
            Friday Transfer Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage ZMA funding for order fulfillment
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isFriday && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
              <Calendar className="h-4 w-4" />
              It's Friday - Transfer Day!
            </div>
          )}
          <Button
            onClick={fetchZMABalance}
            disabled={isLoading}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Balance
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
              Current balance (${balanceData?.balance?.toFixed(2) || '0.00'}) is below pending orders value (${pendingOrders.total_value.toFixed(2)}). Transfer funds immediately.
            </p>
          </div>
        </div>
      )}

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
              Pending Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders.count}</div>
            <p className="text-sm text-muted-foreground">
              Total: ${pendingOrders.total_value.toFixed(2)}
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
              {recommendedTransfer > 0 ? 'To maintain $500 buffer' : 'Balance is sufficient'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transfer Calculator */}
      <TransferCalculator
        pendingOrdersValue={pendingOrders.total_value}
        bufferAmount={BUFFER_AMOUNT}
        currentBalance={balanceData?.balance || 0}
        recommendedTransfer={recommendedTransfer}
      />

      {/* Friday Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Friday Transfer Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <ChecklistItem
              checked={balanceData !== null && lastRefresh !== null}
              label="Check current ZMA balance (click Refresh Balance)"
            />
            <ChecklistItem
              checked={pendingOrders.count > 0 || pendingOrders.total_value === 0}
              label="Review pending orders value"
            />
            <ChecklistItem
              checked={false}
              label="Calculate transfer amount needed"
            />
            <ChecklistItem
              checked={false}
              label="Transfer via PayPal to Zinc"
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
