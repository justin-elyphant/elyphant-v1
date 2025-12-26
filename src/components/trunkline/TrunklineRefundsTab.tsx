import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, Clock, DollarSign, ExternalLink, Loader2 } from "lucide-react";
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

export default function TrunklineRefundsTab() {
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState<string | null>(null);

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
      if (variables.action === 'approve') {
        toast.success(`Refund processed successfully! Stripe ID: ${data.stripe_refund_id}`);
      } else {
        toast.info('Refund request rejected');
      }
      setProcessingId(null);
    },
    onError: (error: Error) => {
      toast.error(`Failed to process refund: ${error.message}`);
      setProcessingId(null);
    },
  });

  const pendingRefunds = refundRequests?.filter(r => r.status === 'pending') || [];
  const processedRefunds = refundRequests?.filter(r => r.status !== 'pending') || [];

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

  const handleApprove = (refundRequestId: string) => {
    setProcessingId(refundRequestId);
    processRefundMutation.mutate({ refundRequestId, action: 'approve' });
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Refund Management</h1>
        <p className="text-muted-foreground">Review and process customer refund requests</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">
                ${pendingRefunds.reduce((sum, r) => sum + r.amount, 0).toFixed(2)}
              </span>
            </div>
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
                    {pendingRefunds.map((refund) => (
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
                        <TableCell className="max-w-xs truncate" title={refund.reason}>
                          {refund.reason}
                        </TableCell>
                        <TableCell>{format(new Date(refund.created_at), 'MMM d, h:mm a')}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(refund.id)}
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
                    ))}
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
    </div>
  );
}
