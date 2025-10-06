import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface ZMAAccount {
  id: string;
  account_name: string;
  account_balance: number;
  account_status: string;
  is_default: boolean;
  last_balance_check: string;
  created_at: string;
}

const ZMAAccountManager = () => {
  const [accounts, setAccounts] = useState<ZMAAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newApiKey, setNewApiKey] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [pendingOrdersValue, setPendingOrdersValue] = useState(0);
  const { toast } = useToast();

  const loadAccounts = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-zma-accounts', {
        body: { action: 'list' }
      });

      if (error) throw error;

      if (data.success) {
        setAccounts(data.accounts);
      }
    } catch (error) {
      console.error('Failed to load ZMA accounts:', error);
      toast(`Failed to load accounts: ${error.message}`);
    }
  };

  const loadPendingOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('funding_status', 'awaiting_funds');

      if (error) throw error;

      setPendingOrdersCount(data?.length || 0);
      setPendingOrdersValue(data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0);
    } catch (error) {
      console.error('Failed to load pending orders:', error);
    }
  };

  const checkFundingStatus = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-zma-funding-status', {
        body: { manualTrigger: true }
      });

      if (error) throw error;

      if (data.success) {
        toast('Funding status checked successfully');
        loadAccounts();
        loadPendingOrders();
      }
    } catch (error) {
      console.error('Failed to check funding status:', error);
      toast(`Failed to check funding status: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (balance: number) => {
    if (pendingOrdersValue === 0) return 'default';
    if (balance >= pendingOrdersValue) return 'success';
    if (balance >= pendingOrdersValue * 0.5) return 'warning';
    return 'destructive';
  };

  const getStatusIcon = (balance: number) => {
    if (pendingOrdersValue === 0) return '🟢';
    if (balance >= pendingOrdersValue) return '🟢';
    if (balance >= pendingOrdersValue * 0.5) return '🟡';
    return '🔴';
  };

  const getStatusText = (balance: number) => {
    if (pendingOrdersValue === 0) return 'No pending orders';
    if (balance >= pendingOrdersValue) return 'Balance sufficient for all pending orders';
    if (balance >= pendingOrdersValue * 0.5) return 'Balance low, can process some orders';
    return 'Balance insufficient, orders on hold';
  };

  const createAccount = async () => {
    if (!newAccountName.trim() || !newApiKey.trim()) {
      toast('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-zma-accounts', {
        body: {
          action: 'create',
          account_name: newAccountName,
          api_key: newApiKey
        }
      });

      if (error) throw error;

      if (data.success) {
        toast('ZMA account created successfully');
        setNewAccountName('');
        setNewApiKey('');
        setShowCreateDialog(false);
        loadAccounts();
      }
    } catch (error) {
      console.error('Failed to create ZMA account:', error);
      toast(`Failed to create account: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkBalance = async (accountId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-zma-accounts', {
        body: {
          action: 'checkBalance',
          account_id: accountId
        }
      });

      if (error) throw error;

      if (data.success) {
        toast(`Balance updated: $${data.balance}`);
        loadAccounts();
      }
    } catch (error) {
      console.error('Failed to check balance:', error);
      toast(`Failed to check balance: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const setDefault = async (accountId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-zma-accounts', {
        body: {
          action: 'setDefault',
          account_id: accountId
        }
      });

      if (error) throw error;

      if (data.success) {
        toast('Default account updated');
        loadAccounts();
      }
    } catch (error) {
      console.error('Failed to set default account:', error);
      toast(`Failed to set default: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
    loadPendingOrders();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>ZMA Account Management</CardTitle>
              <CardDescription>
                Manage Zinc Managed Accounts for reliable order processing
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={checkFundingStatus}
                disabled={loading}
              >
                Check Funding Status
              </Button>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button>Add Account</Button>
                </DialogTrigger>
                <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add ZMA Account</DialogTitle>
                  <DialogDescription>
                    Enter your ZMA account details to add a new account for order processing.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Account Name</label>
                    <Input
                      placeholder="e.g., Primary ZMA Account"
                      value={newAccountName}
                      onChange={(e) => setNewAccountName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">API Key</label>
                    <Input
                      type="password"
                      placeholder="Enter your ZMA API key"
                      value={newApiKey}
                      onChange={(e) => setNewApiKey(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={createAccount} disabled={loading} className="flex-1">
                      {loading ? 'Creating...' : 'Create Account'}
                    </Button>
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No ZMA accounts configured. Add an account to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {accounts.map((account) => (
                <Card key={account.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{account.account_name}</h3>
                        {account.is_default && (
                          <Badge variant="default">Default</Badge>
                        )}
                        <Badge variant={account.account_status === 'active' ? 'default' : 'secondary'}>
                          {account.account_status}
                        </Badge>
                      </div>
                      <div className="text-sm font-medium">
                        Balance: ${account.account_balance.toFixed(2)}
                        {pendingOrdersCount > 0 && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({pendingOrdersCount} orders pending, ${pendingOrdersValue.toFixed(2)})
                          </span>
                        )}
                      </div>
                      {account.is_default && (
                        <div className="flex items-center gap-2 text-sm">
                          <span>{getStatusIcon(account.account_balance)}</span>
                          <span className="text-muted-foreground">{getStatusText(account.account_balance)}</span>
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        Last checked: {new Date(account.last_balance_check).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => checkBalance(account.id)}
                        disabled={loading}
                      >
                        Check Balance
                      </Button>
                      {!account.is_default && (
                        <Button
                          size="sm"
                          onClick={() => setDefault(account.id)}
                          disabled={loading}
                        >
                          Set Default
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ZMAAccountManager;