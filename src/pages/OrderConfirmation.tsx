
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Package, Mail, Home } from "lucide-react";
import { getOrderById, Order } from "@/services/orderService";
import { toast } from "sonner";
import Header from "@/components/home/Header";
import { Skeleton } from "@/components/ui/skeleton";

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      
      try {
        const orderData = await getOrderById(orderId);
        setOrder(orderData);
      } catch (error) {
        console.error("Error fetching order:", error);
        toast.error("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto py-8 px-4 max-w-2xl">
          <div className="space-y-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto py-8 px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
          <p className="text-muted-foreground mb-8">
            We couldn't find the order you're looking for.
          </p>
          <Button onClick={() => navigate("/marketplace")}>
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
          <p className="text-muted-foreground">
            Thank you for your order. We'll send you updates as your order progresses.
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Order Number</p>
                <p className="font-medium">{order.order_number}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Order Date</p>
                <p className="font-medium">
                  {new Date(order.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Amount</p>
                <p className="font-medium">${order.total_amount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className="font-medium capitalize">{order.status}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Items Ordered:</h4>
              <div className="space-y-2">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantity} × ${item.unit_price.toFixed(2)}
                      </p>
                    </div>
                    <p className="font-medium">${item.total_price.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Shipping Address:</h4>
              <div className="text-sm text-muted-foreground">
                <p>{order.shipping_info.name}</p>
                <p>{order.shipping_info.address}</p>
                <p>
                  {order.shipping_info.city}, {order.shipping_info.state} {order.shipping_info.zipCode}
                </p>
                <p>{order.shipping_info.country}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button className="flex-1" onClick={() => navigate("/orders")}>
            <Package className="h-4 w-4 mr-2" />
            View All Orders
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => navigate("/marketplace")}>
            <Home className="h-4 w-4 mr-2" />
            Continue Shopping
          </Button>
        </div>

        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-center">
              <Mail className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium">Email Confirmation Sent</p>
                <p className="text-sm text-muted-foreground">
                  We've sent order details to {order.shipping_info.email}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrderConfirmation;
