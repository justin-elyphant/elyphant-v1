import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getOrderById } from "@/services/orderService";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";
import type { Order } from "@/services/orderService";

const OrderConfirmation = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);

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
      } catch (error) {
        console.error('Error fetching order:', error);
        toast.error('Failed to load order details');
        navigate('/orders');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, navigate]);

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
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h1 className="text-2xl font-bold text-green-600">Order Confirmed!</h1>
            <p className="text-muted-foreground">
              Thank you for your purchase. Your order has been confirmed and will be processed shortly.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm font-medium text-green-800">
                Order Number: {order.order_number}
              </p>
              <p className="text-sm text-green-700 mt-1">
                Total: ${order.total_amount.toFixed(2)} {order.currency.toUpperCase()}
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/orders')} 
              className="w-full"
            >
              View My Orders
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/marketplace')} 
              className="w-full"
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