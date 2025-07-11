
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowLeft, MessageSquare } from "lucide-react";
import { getMockOrders } from "@/components/marketplace/zinc/orderService";
import { toast } from "sonner";

// Import our components
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import OrderSummaryCard from "@/components/orders/OrderSummaryCard";
import ShippingInfoCard from "@/components/orders/ShippingInfoCard";
import OrderItemsTable from "@/components/orders/OrderItemsTable";
import OrderNotesCard from "@/components/orders/OrderNotesCard";
import OrderNotFound from "@/components/orders/OrderNotFound";
import OrderSkeleton from "@/components/orders/OrderSkeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const OrderDetail = () => {
  const { orderId } = useParams();
  const [userData] = useLocalStorage("userData", null);
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [vendorMessage, setVendorMessage] = useState("");

  // Redirect to sign-up if not logged in
  useEffect(() => {
    if (!userData) {
      navigate("/signup");
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

  const handleSendToVendor = () => {
    if (!vendorMessage.trim()) return;
    
    toast.success("Message sent to vendor", {
      description: "The vendor will be notified about your message."
    });
    
    setVendorMessage("");
  };

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
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <MessageSquare className="h-4 w-4 mr-2" />
                Message Vendor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Message Vendor</DialogTitle>
                <DialogDescription>
                  Send a message to the vendor regarding this order
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Textarea
                  placeholder="Type your message to the vendor..."
                  value={vendorMessage}
                  onChange={(e) => setVendorMessage(e.target.value)}
                  rows={4}
                />
              </div>
              <DialogFooter>
                <Button onClick={handleSendToVendor} disabled={!vendorMessage.trim()}>
                  Send Message
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {order.status === "shipped" && (
            <Button>
              <MapPin className="h-4 w-4 mr-2" />
              Track Package
            </Button>
          )}
        </div>
      </div>

      {/* Order Summary and Shipping Information */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <OrderSummaryCard order={order} />
        <ShippingInfoCard order={order} />
      </div>

      {/* Order Items */}
      <OrderItemsTable order={order} />
      
      {/* Order Notes - For internal staff only */}
      <div className="mt-6">
        <OrderNotesCard orderId={order.id} />
      </div>

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
