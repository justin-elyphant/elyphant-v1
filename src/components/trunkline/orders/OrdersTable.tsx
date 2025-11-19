import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, ExternalLink, Package, CreditCard, Clock, CheckCircle, XCircle, AlertTriangle, X, RefreshCw } from "lucide-react";
import { useOrders } from "@/hooks/trunkline/useOrders";
import { useOrderActions } from "@/hooks/useOrderActions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import TrunklineCancelDialog from "./TrunklineCancelDialog";

interface OrdersTableProps {
  orders: ReturnType<typeof useOrders>['orders'];
  loading: boolean;
  onOrderClick?: (orderId: string) => void;
  onOrderUpdated?: () => void;
}

export default function OrdersTable({ orders, loading, onOrderClick, onOrderUpdated }: OrdersTableProps) {
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [retryingOrderId, setRetryingOrderId] = useState<string | null>(null);
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
    // Must have been submitted to Zinc and not already shipped/delivered/cancelled
    return order.zinc_request_id && 
           !['shipped', 'delivered', 'cancelled', 'cancellation_pending'].includes(order.status?.toLowerCase() || '') &&
           !['shipped', 'delivered', 'cancelled'].includes(order.zinc_status?.toLowerCase() || '');
  };

  const handleCancelOrder = async (reason: string) => {
    if (!cancellingOrderId) return;
    const success = await cancelOrder(cancellingOrderId, reason);
    if (success) {
      setCancellingOrderId(null);
      onOrderUpdated?.();
    }
  };

  const canRetryOrder = (order: any) => {
    // Show retry button for:
    // 1. payment_confirmed (stuck before Zinc)
    // 2. failed orders
    // 3. processing but no zinc_order_id (stuck between payment and Zinc)
    return (
      order.status.toLowerCase() === 'payment_confirmed' ||
      order.status.toLowerCase() === 'failed' ||
      (order.status.toLowerCase() === 'processing' && !order.zinc_order_id)
    );
  };

  const handleRetryOrder = async (order: any) => {
    setRetryingOrderId(order.id);
    
    try {
      // Re-invoke process-order-v2 to retry processing
      const { error } = await supabase.functions.invoke('process-order-v2', {
        body: { orderId: order.id }
      });

      if (error) throw error;
      
      toast.success(`Order ${order.order_number} submitted for retry`);
      
      // Refresh orders list after retry
      onOrderUpdated?.();
    } catch (error) {
      console.error('Error retrying order:', error);
      toast.error('Failed to retry order');
    } finally {
      setRetryingOrderId(null);
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
                    {(order as any).gift_options?.isGift && (
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
                        {((order as any).line_items as any[])?.length || 0} items
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
                      <Badge variant="secondary" className="text-xs">
                        Zinc API
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    {order.zinc_order_id ? (
                      <div className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                        Zinc: {order.zinc_order_id}
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
                      {canRetryOrder(order) && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleRetryOrder(order)}
                          disabled={retryingOrderId === order.id}
                        >
                          <RefreshCw className={`h-3 w-3 mr-1 ${retryingOrderId === order.id ? 'animate-spin' : ''}`} />
                          Retry
                        </Button>
                      )}
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
                      {order.payment_intent_id && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(`https://dashboard.stripe.com/payments/${order.payment_intent_id}`, '_blank')}
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
      
      <TrunklineCancelDialog
        isOpen={!!cancellingOrderId}
        onClose={() => setCancellingOrderId(null)}
        onConfirm={handleCancelOrder}
        isProcessing={isProcessing}
        orderNumber={cancellingOrderId ? 
          orders.find(o => o.id === cancellingOrderId)?.order_number?.split('-').pop() || 
          cancellingOrderId.slice(-6) : ''
        }
        orderStatus={cancellingOrderId ? 
          orders.find(o => o.id === cancellingOrderId)?.status || 'unknown' : 'unknown'
        }
        orderAmount={cancellingOrderId ? 
          orders.find(o => o.id === cancellingOrderId)?.total_amount || 0 : 0
        }
      />
    </Card>
  );
}