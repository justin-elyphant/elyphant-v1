import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, ExternalLink, Package, CreditCard, Clock, CheckCircle, XCircle, AlertTriangle, X } from "lucide-react";
import { useOrders } from "@/hooks/trunkline/useOrders";
import { useOrderActions } from "@/hooks/useOrderActions";
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

interface OrdersTableProps {
  orders: ReturnType<typeof useOrders>['orders'];
  loading: boolean;
  onOrderClick?: (orderId: string) => void;
  onOrderUpdated?: () => void;
}

export default function OrdersTable({ orders, loading, onOrderClick, onOrderUpdated }: OrdersTableProps) {
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const { cancelOrder, isProcessing } = useOrderActions();
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'pending':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'cancelled':
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "bg-green-100 text-green-800",
      processing: "bg-blue-100 text-blue-800",
      pending: "bg-orange-100 text-orange-800",
      cancelled: "bg-red-100 text-red-800",
      failed: "bg-red-100 text-red-800",
    };

    return (
      <Badge variant="secondary" className={variants[status as keyof typeof variants] || "bg-slate-100 text-slate-800"}>
        <div className="flex items-center gap-1">
          {getStatusIcon(status)}
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
      </Badge>
    );
  };

  const canCancelOrder = (order: any) => {
    return ['pending', 'failed', 'retry_pending'].includes(order.status.toLowerCase()) &&
           !['shipped', 'delivered', 'cancelled'].includes(order.zinc_status?.toLowerCase() || '');
  };

  const handleCancelOrder = async (orderId: string) => {
    const success = await cancelOrder(orderId, 'User cancelled via Trunkline order management');
    if (success) {
      setCancellingOrderId(null);
      onOrderUpdated?.();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No orders found</h3>
            <p className="text-slate-600">No orders match your current filters.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Orders ({orders.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="w-full overflow-x-auto">
          <div className="min-w-[800px] border rounded-md">{/* Fixed: Remove scrollarea, use plain overflow */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead className="hidden md:table-cell">Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="hidden lg:table-cell">Items</TableHead>
                  <TableHead className="hidden lg:table-cell">Funding</TableHead>
                  <TableHead className="hidden lg:table-cell">Date</TableHead>
                  <TableHead className="hidden xl:table-cell">Method</TableHead>
                  <TableHead className="hidden xl:table-cell">External ID</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id} className="cursor-pointer hover:bg-slate-50">
                  <TableCell>
                    <div className="font-mono text-sm">
                      {order.order_number}
                    </div>
                    {order.is_gift && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        Gift Order
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div>
                      <div className="font-medium">
                        User ID: {order.user_id?.slice(0, 8) || 'Unknown'}
                      </div>
                      <div className="text-sm text-slate-600">
                        {order.user_id ? `${order.user_id.slice(0, 8)}...` : 'No user ID'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(order.status)}
                    {order.zinc_status && order.zinc_status !== order.status && (
                      <div className="text-xs text-slate-600 mt-1">
                        Zinc: {order.zinc_status}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      ${Number(order.total_amount).toFixed(2)}
                    </div>
                    <div className="text-xs text-slate-600">
                      {order.currency}
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex items-center gap-1">
                      <Package className="h-3 w-3 text-slate-400" />
                      <span className="text-sm">
                        {order.order_items?.length || 0} items
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {(order as any).funding_status ? (
                      <Badge 
                        variant={(order as any).funding_status === 'funded' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {(order as any).funding_status === 'awaiting_funds' && '⏳ Awaiting'}
                        {(order as any).funding_status === 'funds_allocated' && '🔒 Allocated'}
                        {(order as any).funding_status === 'funded' && '✅ Funded'}
                      </Badge>
                    ) : (
                      <span className="text-xs text-slate-400">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="text-sm">
                      {new Date(order.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-slate-600">
                      {new Date(order.created_at).toLocaleTimeString()}
                    </div>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    <div className="space-y-1">
                      <Badge variant={order.order_method === 'zma' ? 'default' : 'secondary'} className="text-xs">
                        {order.order_method === 'zma' ? 'ZMA' : 'Zinc API'}
                      </Badge>
                      {order.zma_account_used && (
                        <div className="text-xs text-slate-600">
                          {order.zma_account_used}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    {order.zinc_order_id ? (
                      <div className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                        Zinc: {order.zinc_order_id}
                      </div>
                    ) : order.zma_order_id ? (
                      <div className="font-mono text-xs bg-blue-100 px-2 py-1 rounded">
                        ZMA: {order.zma_order_id}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onOrderClick?.(order.id)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      {canCancelOrder(order) && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setCancellingOrderId(order.id)}
                          disabled={isProcessing}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Cancel
                        </Button>
                      )}
                      {order.stripe_payment_intent_id && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(`https://dashboard.stripe.com/payments/${order.stripe_payment_intent_id}`, '_blank')}
                        >
                          <CreditCard className="h-3 w-3 mr-1" />
                          Stripe
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </div>
      </CardContent>
      
      <AlertDialog open={!!cancellingOrderId} onOpenChange={() => setCancellingOrderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Cancel Order
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this order? This action cannot be undone.
              {cancellingOrderId && orders.find(o => o.id === cancellingOrderId)?.status === 'processing' && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                  <strong>Note:</strong> This order is currently being processed. Cancellation may take some time to complete.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              Keep Order
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => cancellingOrderId && handleCancelOrder(cancellingOrderId)}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? 'Cancelling...' : 'Cancel Order'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}