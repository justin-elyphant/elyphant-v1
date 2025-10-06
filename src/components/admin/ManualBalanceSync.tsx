import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ManualBalanceSync = () => {
  const [balance, setBalance] = useState("");
  const [notes, setNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSync = async () => {
    if (!balance || parseFloat(balance) < 0) {
      toast.error("Please enter a valid balance");
      return;
    }

    setIsUpdating(true);
    try {
      const { data, error } = await supabase.rpc('update_zma_balance_manual', {
        p_new_balance: parseFloat(balance),
        p_notes: notes || null
      });

      if (error) throw error;

      const result = data as { success: boolean; old_balance: number; new_balance: number; account_id: string; updated_by: string; updated_at: string };

      toast.success(`Balance updated successfully`, {
        description: `Old: $${result.old_balance.toFixed(2)} → New: $${result.new_balance.toFixed(2)}`
      });

      // Refresh the page to show updated balance
      window.location.reload();
    } catch (error: any) {
      console.error('Balance sync error:', error);
      toast.error('Failed to update balance', {
        description: error.message || 'Please try again'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-primary" />
          Manual Balance Sync
        </CardTitle>
        <CardDescription>
          Update ZMA balance manually from the Zinc dashboard when automatic sync fails
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted p-3 rounded-md text-sm">
          <p className="font-medium mb-1">When to use this:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Automatic balance checks are failing (DNS issues)</li>
            <li>Balance shown doesn't match Zinc dashboard</li>
            <li>After manual fund transfers to Zinc account</li>
          </ul>
        </div>

        <div className="space-y-2">
          <Label htmlFor="balance">Current Balance from Zinc Dashboard</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="balance"
              type="number"
              step="0.01"
              min="0"
              placeholder="349.39"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="pl-9"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Enter the exact balance you see in your Zinc account dashboard
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            placeholder="e.g., Synced after DNS error, matched Zinc dashboard at 2:45 PM"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        <Button 
          onClick={handleSync} 
          disabled={isUpdating || !balance}
          className="w-full"
        >
          {isUpdating ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Updating Balance...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync Balance Now
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ManualBalanceSync;
