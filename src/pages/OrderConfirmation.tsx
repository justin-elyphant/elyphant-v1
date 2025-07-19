
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getOrderById } from "@/services/orderService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Loader2, Package, CreditCard, Truck, AlertCircle } from "lucide-react";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";
import type { Order } from "@/services/orderService";

const OrderConfirmation = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string>('checking');

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        toast.error('Invalid order ID');
        navigate('/marketplace');
        return;
      }

      try {
        const orderData = await getOrderById(orderId);
        if (!orderData) {
          toast.error('Order not found');
          navigate('/orders');
          return;
        }
        setOrder(orderData);
        
        // Check if order needs processing
        if (orderData.payment_status === 'succeeded' && !orderData.zinc_order_id && orderData.status !== 'processing') {
          setProcessingStatus('needs_processing');
          await attemptOrderProcessing(orderId);
        } else if (orderData.zinc_order_id) {
          setProcessingStatus('processed');
        } else if (orderData.status === 'processing') {
          setProcessingStatus('processing');
        } else {
          setProcessingStatus('pending');
        }
      } catch (error) {
        console.error('Error fetching order:', error);
        toast.error('Failed to load order details');
        navigate('/orders');
      } finally {
        setIsLoading(false);
      }
    };

    const attemptOrderProcessing = async (orderIdToProcess: string) => {
      try {
        console.log('Attempting to process order:', orderIdToProcess);
        setProcessingStatus('processing');
        
        const { data, error } = await supabase.functions.invoke('process-zinc-order', {
          body: {
            orderId: orderIdToProcess,
            isTestMode: true // Set to false for production
          }
        });

        if (error) {
          console.error('Order processing error:', error);
          setProcessingStatus('failed');
          toast.error('Order processing encountered an issue. Our team has been notified.');
        } else if (data?.success) {
          console.log('Order processed successfully:', data.zincOrderId);
          setProcessingStatus('processed');
          toast.success('Order processed successfully!');
          
          // Refresh order data
          const updatedOrder = await getOrderById(orderIdToProcess);
          if (updatedOrder) {
            setOrder(updatedOrder);
          }
        } else {
          console.warn('Order processing returned unexpected result:', data);
          setProcessingStatus('failed');
        }
      } catch (error) {
        console.error('Error processing order:', error);
        setProcessingStatus('failed');
      }
    };

    fetchOrder();
  }, [orderId, navigate]);

  const getStatusBadge = (status: string, zincStatus?: string) => {
    if (status === 'cancelled') {
      return <Badge variant="destructive">Cancelled</Badge>;
    }
    if (status === 'failed') {
      return <Badge variant="destructive">Failed</Badge>;
    }
    if (zincStatus === 'shipped' || status === 'shipped') {
      return <Badge className="bg-blue-500">Shipped</Badge>;
    }
    if (zincStatus === 'delivered' || status === 'delivered') {
      return <Badge className="bg-green-500">Delivered</Badge>;
    }
    if (status === 'processing' || zincStatus === 'placed') {
      return <Badge className="bg-orange-500">Processing</Badge>;
    }
    return <Badge variant="secondary">Pending</Badge>;
  };

  const getPaymentStatusBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'succeeded':
        return <Badge className="bg-green-500">Payment Successful</Badge>;
      case 'pending':
        return <Badge variant="secondary">Payment Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Payment Failed</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getProcessingStatusDisplay = () => {
    switch (processingStatus) {
      case 'checking':
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Checking order status...</span>
          </div>
        );
      case 'needs_processing':
        return (
          <div className="flex items-center gap-2 text-orange-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Processing order for fulfillment...</span>
          </div>
        );
      case 'processing':
        return (
          <div className="flex items-center gap-2 text-orange-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Order being processed...</span>
          </div>
        );
      case 'processed':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>Order processed successfully</span>
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>Processing issue - Our team has been notified</span>
          </div>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto" />
            <h2 className="text-xl font-semibold">Loading order details...</h2>
            <p className="text-muted-foreground">Please wait while we fetch your order information.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold">Order not found</h2>
            <p className="text-muted-foreground">The order you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/orders')}>View All Orders</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Success Header */}
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h1 className="text-3xl font-bold text-green-600">Order Confirmed!</h1>
            <p className="text-muted-foreground text-lg">
              Thank you for your purchase. Your order has been confirmed.
            </p>
          </div>

          {/* Order Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order Number</p>
                  <p className="font-semibold">{order.order_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="font-semibold">${order.total_amount.toFixed(2)} {order.currency.toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Order Status</p>
                  <div className="mt-1">
                    {getStatusBadge(order.status, order.zinc_status)}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Status</p>
                  <div className="mt-1">
                    {getPaymentStatusBadge(order.payment_status)}
                  </div>
                </div>
              </div>

              {/* Processing Status */}
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-2">Fulfillment Status</p>
                {getProcessingStatusDisplay()}
                {order.zinc_order_id && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Zinc Order ID: {order.zinc_order_id}
                  </p>
                )}
              </div>

              {/* Shipping Information */}
              {order.shipping_info && (
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-2">Shipping Address</p>
                  <div className="text-sm">
                    <p>{order.shipping_info.name}</p>
                    <p>{order.shipping_info.address}</p>
                    {order.shipping_info.addressLine2 && <p>{order.shipping_info.addressLine2}</p>}
                    <p>{order.shipping_info.city}, {order.shipping_info.state} {order.shipping_info.zipCode}</p>
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-3">Items Ordered</p>
                <div className="space-y-2">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                      <div className="flex-1">
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                      </div>
                      <p className="font-semibold">${item.total_price.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={() => navigate('/orders')} 
              className="flex-1 max-w-xs"
            >
              <Package className="h-4 w-4 mr-2" />
              View All Orders
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/marketplace')} 
              className="flex-1 max-w-xs"
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrderConfirmation;
