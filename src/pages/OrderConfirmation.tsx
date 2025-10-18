import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Package, Truck, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarLayout } from "@/components/layout/SidebarLayout";

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  is_split_order: boolean | null;
  parent_order_id: string | null;
  delivery_group_id: string | null;
  split_order_index: number | null;
  total_split_orders: number | null;
  cart_data?: any;
  order_items?: any[];
}

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [childOrders, setChildOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [pollingCount, setPollingCount] = useState(0);
  const [pollingStartTime] = useState<number>(Date.now());
  const [showProgressiveError, setShowProgressiveError] = useState(false);

  useEffect(() => {
    if (!orderId) {
      navigate('/orders');
      return;
    }

    fetchOrderDetails();
    
    // Poll for status updates every 3 seconds for up to 30 seconds
    const interval = setInterval(() => {
      setPollingCount(prev => prev + 1);
      fetchOrderDetails();
    }, 3000);
    
    // Show progressive error after 15 seconds
    const progressiveTimeout = setTimeout(() => {
      if (!order) setShowProgressiveError(true);
    }, 15000);
    
    // Stop polling after 30 seconds
    const stopPollingTimeout = setTimeout(() => clearInterval(interval), 30000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(progressiveTimeout);
      clearTimeout(stopPollingTimeout);
    };
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const result = await (supabase as any).from('orders').select('*, order_items(*)').eq('id', orderId).maybeSingle();
      let orderData = result.data;

      if (!orderData) {
        // Try to resolve session_id to cart_sessions.id
        const sessionLookup = await (supabase as any).from('cart_sessions').select('id').eq('session_id', orderId).maybeSingle();
        
        if (sessionLookup.data?.id) {
          const sessionResult = await (supabase as any).from('orders').select('*, order_items(*)').eq('cart_session_id', sessionLookup.data.id).order('created_at', { ascending: false }).limit(1);
          if (sessionResult.data?.[0]) orderData = sessionResult.data[0];
        }
      }

      if (orderData) {
        setOrder(orderData);
        if (orderData.is_split_order && !orderData.parent_order_id) {
          const childResult = await (supabase as any).from('orders').select('*, order_items(*)').eq('parent_order_id', orderData.id).order('split_order_index');
          if (childResult.data) setChildOrders(childResult.data);
        }
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Error fetching order:', err);
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'processing':
      case 'shipped':
        return <Truck className="w-5 h-5 text-blue-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'failed':
      case 'cancelled':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Package className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      delivered: "default",
      processing: "secondary",
      shipped: "secondary",
      pending: "outline",
      failed: "destructive",
      cancelled: "destructive"
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  // Progressive loading state
  if (loading || (!order && pollingCount < 4)) {
    const timeElapsed = Math.floor((Date.now() - pollingStartTime) / 1000);
    
    return (
      <SidebarLayout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <CheckCircle className="w-10 h-10 text-primary animate-pulse" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
            <p className="text-muted-foreground">
              {timeElapsed < 10 
                ? "Creating your order..." 
                : "Still processing... This may take a moment"}
            </p>
          </div>
          <Card className="p-6 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
          </Card>
        </div>
      </SidebarLayout>
    );
  }

  // Progressive error state
  if (!order && showProgressiveError) {
    const timeElapsed = Math.floor((Date.now() - pollingStartTime) / 1000);
    
    return (
      <SidebarLayout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card className="p-8 text-center">
            <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">
              {timeElapsed < 25 ? "Still Processing Your Order" : "Taking Longer Than Usual"}
            </h2>
            <p className="text-muted-foreground mb-2">
              Your payment was successful! We're just finishing up your order.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              This sometimes takes up to a minute. Your order will appear shortly.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => window.location.reload()} variant="default">
                Refresh Page
              </Button>
              <Button onClick={() => navigate('/orders')} variant="outline">
                View All Orders
              </Button>
            </div>
          </Card>
        </div>
      </SidebarLayout>
    );
  }

  const isMultiRecipient = order.is_split_order && !order.parent_order_id;

  return (
    <SidebarLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
          <p className="text-muted-foreground">
            Your order has been received and is being processed
          </p>
        </div>

        {/* Order Number */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Order Number</p>
              <p className="text-2xl font-bold">{order.order_number}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Status</p>
              {getStatusBadge(order.status)}
            </div>
          </div>
          
          {isMultiRecipient && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900 dark:text-blue-100">Multiple Recipients</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Your order has been split into {childOrders.length} separate shipments for different recipients
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Child Orders (Multi-Recipient) */}
        {isMultiRecipient && childOrders.length > 0 && (
          <div className="space-y-4 mb-6">
            <h2 className="text-xl font-semibold">Shipments</h2>
            {childOrders.map((child, index) => {
              const childRecipient = child.cart_data?.recipient?.name || `Recipient ${index + 1}`;
              
              return (
                <Card key={child.id} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(child.status)}
                      <div>
                        <p className="font-semibold">
                          To: {childRecipient}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Order #{child.order_number}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(child.status)}
                  </div>

                  <div className="space-y-2">
                    {child.order_items?.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 py-2 border-t">
                        {item.product_image && (
                          <img 
                            src={item.product_image} 
                            alt={item.product_name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.product_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Qty: {item.quantity} × ${item.unit_price.toFixed(2)}
                          </p>
                        </div>
                        <p className="font-semibold">
                          ${(item.quantity * item.unit_price).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {child.cart_data?.giftOptions?.giftMessage && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Gift Message:</p>
                      <p className="text-sm italic">"{child.cart_data.giftOptions.giftMessage}"</p>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t flex justify-between items-center">
                    <span className="font-semibold">Subtotal:</span>
                    <span className="text-lg font-bold">${child.total_amount.toFixed(2)}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Single Order Items */}
        {!isMultiRecipient && (
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.order_items?.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 pb-4 border-b last:border-0">
                  {item.product_image && (
                    <img 
                      src={item.product_image} 
                      alt={item.product_name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold">{item.product_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Quantity: {item.quantity}
                    </p>
                    {item.gift_message && (
                      <p className="text-sm italic text-muted-foreground mt-1">
                        "{item.gift_message}"
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${(item.quantity * item.unit_price).toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">${item.unit_price.toFixed(2)} each</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Order Total */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${order.cart_data?.subtotal?.toFixed(2) || '0.00'}</span>
            </div>
            {order.cart_data?.shippingCost > 0 && (
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span>${order.cart_data.shippingCost.toFixed(2)}</span>
              </div>
            )}
            {order.cart_data?.taxAmount > 0 && (
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>${order.cart_data.taxAmount.toFixed(2)}</span>
              </div>
            )}
            {order.cart_data?.giftingFee > 0 && (
              <div className="flex justify-between">
                <span>Gifting Fee:</span>
                <span>${order.cart_data.giftingFee.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold pt-2 border-t">
              <span>Total:</span>
              <span>${order.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button onClick={() => navigate('/orders')} variant="default" className="flex-1">
            View All Orders
          </Button>
          <Button onClick={() => navigate('/marketplace')} variant="outline" className="flex-1">
            Continue Shopping
          </Button>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default OrderConfirmation;
