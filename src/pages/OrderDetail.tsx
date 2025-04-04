
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowLeft } from "lucide-react";
import { getMockOrders } from "@/components/marketplace/zinc/orderService";
import { toast } from "sonner";

// Import our new components
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import OrderSummaryCard from "@/components/orders/OrderSummaryCard";
import ShippingInfoCard from "@/components/orders/ShippingInfoCard";
import OrderItemsTable from "@/components/orders/OrderItemsTable";
import OrderNotFound from "@/components/orders/OrderNotFound";
import OrderSkeleton from "@/components/orders/OrderSkeleton";

const OrderDetail = () => {
  const { orderId } = useParams();
  const [userData] = useLocalStorage("userData", null);
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect to sign-up if not logged in
  useEffect(() => {
    if (!userData) {
      navigate("/sign-up");
    }
  }, [userData, navigate]);

  // Load order details
  useEffect(() => {
    if (!orderId) return;
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const orders = getMockOrders();
      const foundOrder = orders.find(o => o.id === orderId);
      
      if (foundOrder) {
        setOrder(foundOrder);
      } else {
        toast.error("Order not found");
        navigate("/orders");
      }
      
      setIsLoading(false);
    }, 500);
  }, [orderId, navigate]);

  if (!userData || isLoading) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4 flex justify-center">
        <OrderSkeleton />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <OrderNotFound />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate("/orders")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>
      </div>

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">Order #{order.id.slice(-6)}</h1>
          <p className="text-muted-foreground">
            Placed on {new Date(order.date).toLocaleDateString()} • <OrderStatusBadge status={order.status} />
          </p>
        </div>
        {order.status === "shipped" && (
          <Button>
            <MapPin className="h-4 w-4 mr-2" />
            Track Package
          </Button>
        )}
      </div>

      {/* Order Summary and Shipping Information */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <OrderSummaryCard order={order} />
        <ShippingInfoCard order={order} />
      </div>

      {/* Order Items */}
      <OrderItemsTable order={order} />

      <div className="mt-6 flex justify-end">
        {order.status === "delivered" && (
          <Button variant="default" onClick={() => navigate(`/returns/${order.id}`)}>
            Start Return
          </Button>
        )}
      </div>
    </div>
  );
};

export default OrderDetail;
