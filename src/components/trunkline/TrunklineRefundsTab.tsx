import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckCircle, XCircle, Clock, DollarSign, ExternalLink, Loader2, AlertTriangle, Wallet, Info, BanknoteIcon } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface RefundRequest {
  id: string;
  order_id: string;
  amount: number;
  reason: string;
  status: string;
  refund_type?: string | null;
  stripe_refund_id: string | null;
  processed_at: string | null;
  created_at: string;
  orders: {
    id: string;
    order_number: string;
    shipping_address: any;
    payment_intent_id: string | null;
  } | null;
}

interface StripeBalance {
  available: number;
  pending: number;
  currency: string;
  retrieved_at: string;
}

export default function TrunklineRefundsTab() {
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null);

  // Fetch Stripe balance
  const { data: stripeBalance, isLoading: balanceLoading } = useQuery({
    queryKey: ['stripe-balance'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-stripe-balance');
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data as StripeBalance;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: refundRequests, isLoading } = useQuery({
    queryKey: ['refund-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('refund_requests')
        .select(`
          *,
          orders:order_id (
            id,
            order_number,
            shipping_address,
            payment_intent_id
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as RefundRequest[];
    },
  });

  const processRefundMutation = useMutation({
    mutationFn: async ({ refundRequestId, action }: { refundRequestId: string; action: 'approve' | 'reject' }) => {
      const { data, error } = await supabase.functions.invoke('process-stripe-refund', {
        body: { refund_request_id: refundRequestId, action },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['refund-requests'] });
      queryClient.invalidateQueries({ queryKey: ['stripe-balance'] });
      if (variables.action === 'approve') {
        const bankDebitedMsg = data.balance_info?.will_debit_bank 
          ? ' (Bank was debited due to low Stripe balance)' 
          : '';
        toast.success(`Refund processed successfully!${bankDebitedMsg} Stripe ID: ${data.stripe_refund_id}`);
      } else {
        toast.info('Refund request rejected');
      }
      setProcessingId(null);
      setSelectedRefund(null);
    },
    onError: (error: Error) => {
      toast.error(`Failed to process refund: ${error.message}`);
      setProcessingId(null);
      setSelectedRefund(null);
    },
  });

  const pendingRefunds = refundRequests?.filter(r => r.status === 'pending') || [];
  const processedRefunds = refundRequests?.filter(r => r.status !== 'pending') || [];
  const totalPendingAmount = pendingRefunds.reduce((sum, r) => sum + r.amount, 0);

  // Calculate if balance is sufficient
  const isBalanceLow = stripeBalance && stripeBalance.available < totalPendingAmount;
  const balanceShortfall = stripeBalance ? totalPendingAmount - stripeBalance.available : 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="h-3 w-3 mr-1" /> Completed</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="h-3 w-3 mr-1" /> Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCustomerName = (refund: RefundRequest) => {
    return refund.orders?.shipping_address?.name || refund.orders?.shipping_address?.email?.split('@')[0] || 'Unknown';
  };

  const willDebitBank = (refundAmount: number) => {
    return stripeBalance && stripeBalance.available < refundAmount;
  };

  const handleApproveClick = (refund: RefundRequest) => {
    if (willDebitBank(refund.amount)) {
      setSelectedRefund(refund);
      setConfirmDialogOpen(true);
    } else {
      handleApprove(refund.id);
    }
  };

  const handleApprove = (refundRequestId: string) => {
    setProcessingId(refundRequestId);
    processRefundMutation.mutate({ refundRequestId, action: 'approve' });
  };

  const handleConfirmedApprove = () => {
    if (selectedRefund) {
      handleApprove(selectedRefund.id);
    }
    setConfirmDialogOpen(false);
  };

  const handleReject = (refundRequestId: string) => {
    setProcessingId(refundRequestId);
    processRefundMutation.mutate({ refundRequestId, action: 'reject' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Refund Management</h1>
          <p className="text-muted-foreground">Review and process customer refund requests</p>
        </div>

        {/* Low Balance Warning */}
        {isBalanceLow && (
          <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Low Stripe Balance</AlertTitle>
            <AlertDescription>
              Your Stripe balance (${stripeBalance?.available.toFixed(2)}) is less than pending refunds (${totalPendingAmount.toFixed(2)}). 
              Approving refunds will debit your connected bank account for the shortfall of ${balanceShortfall.toFixed(2)}.
            </AlertDescription>
          </Alert>
        )}

        {/* Balance & Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Stripe Balance Card */}
          <Card className="border-2 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                Stripe Balance
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>If Stripe balance is insufficient, Stripe will automatically debit your connected bank account to cover refunds.</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {balanceLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-green-500" />
                    <span className="text-2xl font-bold">${stripeBalance?.available.toFixed(2) || '0.00'}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    + ${stripeBalance?.pending.toFixed(2) || '0.00'} pending (48h payout delay)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approval</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <span className="text-2xl font-bold">{pendingRefunds.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card className={isBalanceLow ? "border-amber-300" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className={`h-5 w-5 ${isBalanceLow ? 'text-amber-500' : 'text-green-500'}`} />
                <span className="text-2xl font-bold">${totalPendingAmount.toFixed(2)}</span>
              </div>
              {isBalanceLow && (
                <p className="text-xs text-amber-600 mt-1">Exceeds available balance</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Processed Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold">
                  {processedRefunds.filter(r => 
                    r.processed_at && new Date(r.processed_at).toDateString() === new Date().toDateString()
                  ).length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList>
            <TabsTrigger value="pending">
              Pending Approval {pendingRefunds.length > 0 && `(${pendingRefunds.length})`}
            </TabsTrigger>
            <TabsTrigger value="processed">Processed</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pending Refund Requests</CardTitle>
                <CardDescription>Review and approve or reject refund requests</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingRefunds.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No pending refund requests
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Requested</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingRefunds.map((refund) => {
                        const needsBankDebit = willDebitBank(refund.amount);
                        return (
                          <TableRow key={refund.id}>
                            <TableCell>
                              <a
                                href={`/orders/${refund.order_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-blue-600 hover:underline"
                              >
                                #{refund.orders?.order_number?.slice(-6) || refund.order_id.slice(-6)}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </TableCell>
                            <TableCell>{getCustomerName(refund)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">${refund.amount.toFixed(2)}</span>
                                {needsBankDebit && (
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <BanknoteIcon className="h-4 w-4 text-amber-500" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Will debit bank account</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-xs truncate" title={refund.reason}>
                              {refund.reason}
                            </TableCell>
                            <TableCell>{format(new Date(refund.created_at), 'MMM d, h:mm a')}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant={needsBankDebit ? "outline" : "default"}
                                  className={needsBankDebit ? "border-amber-300 text-amber-700 hover:bg-amber-50" : ""}
                                  onClick={() => handleApproveClick(refund)}
                                  disabled={processingId === refund.id}
                                >
                                  {processingId === refund.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Approve
                                    </>
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleReject(refund.id)}
                                  disabled={processingId === refund.id}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="processed">
            <Card>
              <CardHeader>
                <CardTitle>Processed Refunds</CardTitle>
                <CardDescription>History of approved and rejected refunds</CardDescription>
              </CardHeader>
              <CardContent>
                {processedRefunds.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No processed refunds yet
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Stripe Refund ID</TableHead>
                        <TableHead>Processed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processedRefunds.map((refund) => (
                        <TableRow key={refund.id}>
                          <TableCell>
                            <a
                              href={`/orders/${refund.order_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-blue-600 hover:underline"
                            >
                              #{refund.orders?.order_number?.slice(-6) || refund.order_id.slice(-6)}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </TableCell>
                          <TableCell>{getCustomerName(refund)}</TableCell>
                          <TableCell className="font-medium">${refund.amount.toFixed(2)}</TableCell>
                          <TableCell>{getStatusBadge(refund.status)}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {refund.stripe_refund_id || '-'}
                          </TableCell>
                          <TableCell>
                            {refund.processed_at 
                              ? format(new Date(refund.processed_at), 'MMM d, h:mm a')
                              : '-'
                            }
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Bank Debit Confirmation Dialog */}
        <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Confirm Bank Debit
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>
                  Your Stripe balance (${stripeBalance?.available.toFixed(2)}) is insufficient to cover this refund of ${selectedRefund?.amount.toFixed(2)}.
                </p>
                <p>
                  Stripe will automatically debit your connected bank account to process this refund.
                </p>
                <p className="font-medium text-foreground">
                  Are you sure you want to proceed?
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmedApprove}
                className="bg-amber-600 hover:bg-amber-700"
              >
                <BanknoteIcon className="h-4 w-4 mr-2" />
                Approve & Debit Bank
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
