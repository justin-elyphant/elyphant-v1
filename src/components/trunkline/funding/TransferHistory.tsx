import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { History, Plus, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface TransferRecord {
  id: string;
  created_at: string;
  update_source: string;
  previous_balance: number;
  new_balance: number;
  notes: string | null;
  account_id: string | null;
}

interface TransferHistoryProps {
  onTransferRecorded: () => void;
}

export function TransferHistory({ onTransferRecorded }: TransferHistoryProps) {
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    amount: '',
    notes: '',
  });

  const fetchTransferHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('zma_balance_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTransfers(data || []);
    } catch (error) {
      console.error('Error fetching transfer history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransferHistory();
  }, []);

  const recordTransfer = async () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid transfer amount');
      return;
    }

    setIsSubmitting(true);
    try {
      // Get current balance
      const { data: currentAccount } = await supabase
        .from('zma_accounts')
        .select('account_balance, id')
        .limit(1)
        .single();

      const currentBalance = currentAccount?.account_balance || 0;
      const transferAmount = parseFloat(formData.amount);
      const newBalance = currentBalance + transferAmount;

      // Record in audit log
      const { error: auditError } = await supabase
        .from('zma_balance_audit_log')
        .insert({
          update_source: 'manual_transfer',
          previous_balance: currentBalance,
          new_balance: newBalance,
          notes: formData.notes || `Friday transfer: $${transferAmount.toFixed(2)}`,
          account_id: currentAccount?.id || null,
        } as any);

      if (auditError) throw auditError;

      // Update ZMA account balance
      if (currentAccount?.id) {
        const { error: updateError } = await supabase
          .from('zma_accounts')
          .update({
            account_balance: newBalance,
            last_balance_check: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentAccount.id);

        if (updateError) throw updateError;
      }

      toast.success(`Transfer of $${transferAmount.toFixed(2)} recorded successfully`);
      setIsDialogOpen(false);
      setFormData({ amount: '', notes: '' });
      fetchTransferHistory();
      onTransferRecorded();
    } catch (error) {
      console.error('Error recording transfer:', error);
      toast.error('Failed to record transfer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="h-5 w-5" />
          Transfer History
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="default" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Record Transfer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Manual Transfer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Transfer Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="500.00"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="e.g., Friday transfer via PayPal"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={recordTransfer} disabled={isSubmitting}>
                {isSubmitting ? (
                  'Recording...'
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Record Transfer
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : transfers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No transfer history found. Record your first transfer above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-muted-foreground">
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium text-right">Amount</th>
                  <th className="pb-2 font-medium text-right">Balance</th>
                  <th className="pb-2 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((transfer) => {
                  const amountChanged = transfer.new_balance - transfer.previous_balance;
                  return (
                    <tr key={transfer.id} className="border-b last:border-0">
                      <td className="py-3 text-sm">
                        {format(new Date(transfer.created_at), 'MMM d, yyyy')}
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          transfer.update_source === 'manual_transfer'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {transfer.update_source === 'manual_transfer' ? 'Transfer' : transfer.update_source}
                        </span>
                      </td>
                      <td className="py-3 text-sm text-right font-medium text-green-600">
                        {amountChanged > 0 ? `+$${amountChanged.toFixed(2)}` : `-$${Math.abs(amountChanged).toFixed(2)}`}
                      </td>
                      <td className="py-3 text-sm text-right">
                        ${transfer.previous_balance?.toFixed(2)} → ${transfer.new_balance?.toFixed(2)}
                      </td>
                      <td className="py-3 text-sm text-muted-foreground max-w-[200px] truncate">
                        {transfer.notes || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
