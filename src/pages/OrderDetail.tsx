
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  TruckIcon, 
  RefreshCw, 
  MapPin, 
  ArrowLeft,
  InfoIcon, 
  Mail
} from "lucide-react";
import { getMockOrders } from "@/components/marketplace/zinc/orderService";
import { ZincOrder } from "@/components/marketplace/zinc/types";
import { toast } from "sonner";

const OrderDetail = () => {
  const { orderId } = useParams();
  const [userData] = useLocalStorage("userData", null);
  const navigate = useNavigate();
  const [order, setOrder] = useState<ZincOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

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

  const handleEmailReceipt = () => {
    setIsSendingEmail(true);
    
    // Simulate API call to send email
    setTimeout(() => {
      toast.success("Receipt sent to your email");
      setIsSendingEmail(false);
    }, 1000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
            <Package className="h-3 w-3 mr-1" />
            <span>Delivered</span>
          </Badge>
        );
      case "shipped":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
            <TruckIcon className="h-3 w-3 mr-1" />
            <span>Shipped</span>
          </Badge>
        );
      case "processing":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-800 hover:bg-yellow-100">
            <RefreshCw className="h-3 w-3 mr-1" />
            <span>Processing</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
          </Badge>
        );
    }
  };

  if (!userData || isLoading) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4 flex justify-center">
        <div className="animate-pulse flex flex-col w-full max-w-3xl">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="h-64 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <Card>
          <CardContent className="pt-6 flex flex-col items-center justify-center h-64">
            <InfoIcon className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
            <p className="text-muted-foreground mb-4">We couldn't find the order you're looking for.</p>
            <Button onClick={() => navigate("/orders")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </CardContent>
        </Card>
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
            Placed on {new Date(order.date!).toLocaleDateString()} • {getStatusBadge(order.status)}
          </p>
        </div>
        {order.status === "shipped" && (
          <Button>
            <MapPin className="h-4 w-4 mr-2" />
            Track Package
          </Button>
        )}
      </div>

      {/* Order Summary */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Order Date:</dt>
                <dd>{new Date(order.date!).toLocaleDateString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Order Number:</dt>
                <dd>#{order.id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Status:</dt>
                <dd>{getStatusBadge(order.status)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Customer:</dt>
                <dd>{order.customerName}</dd>
              </div>
              <div className="flex justify-between font-semibold">
                <dt>Total:</dt>
                <dd>${order.total?.toFixed(2)}</dd>
              </div>
              <div className="pt-4 border-t">
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleEmailReceipt}
                  disabled={isSendingEmail}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {isSendingEmail ? "Sending..." : "Email Receipt"}
                </Button>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shipping Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {order.status === "delivered" ? "Delivered to:" : "Shipping to:"}
            </p>
            <div className="mb-4">
              <p className="font-medium">{order.customerName}</p>
              <p>123 Main Street</p>
              <p>Apt 4B</p>
              <p>San Francisco, CA 94103</p>
              <p>United States</p>
            </div>
            {order.status === "shipped" && (
              <div className="mt-4">
                <p className="font-medium">Tracking Number:</p>
                <p className="text-blue-600">1Z999AA10123456784</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
          <CardDescription>
            {order.items?.length} item{order.items?.length !== 1 ? 's' : ''} in your order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items?.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">${item.price?.toFixed(2)}</TableCell>
                  <TableCell className="text-right">${(item.price * item.quantity).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <div className="flex justify-end mt-6">
            <div className="w-full max-w-xs">
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>${order.total?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Shipping:</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Tax:</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between py-2 font-bold">
                <span>Total:</span>
                <span>${order.total?.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
