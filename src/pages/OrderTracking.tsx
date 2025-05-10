
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Package, 
  MapPin, 
  ArrowLeft, 
  Truck, 
  CheckCircle2, 
  Clock, 
  PackageOpen, 
  Calendar, 
  Gift 
} from 'lucide-react';
import { toast } from "sonner";

interface TrackingStep {
  status: string;
  location: string;
  timestamp: string;
  completed: boolean;
  current: boolean;
}

interface OrderDetails {
  id: string;
  status: 'processing' | 'shipped' | 'delivered' | 'failed';
  trackingNumber: string;
  carrier: string;
  estimatedDelivery: string;
  shippedDate: string;
  isGift: boolean;
  recipientName?: string;
  steps: TrackingStep[];
  productName: string;
  productImage: string;
}

const DEMO_ORDER: OrderDetails = {
  id: 'ORD-12345',
  status: 'shipped',
  trackingNumber: '9400123456789012345678',
  carrier: 'USPS',
  estimatedDelivery: '2025-05-15',
  shippedDate: '2025-05-10',
  isGift: true,
  recipientName: 'Alex Johnson',
  productName: 'Leather Wallet',
  productImage: 'https://picsum.photos/200/300?random=1',
  steps: [
    {
      status: 'Order Placed',
      location: 'Online',
      timestamp: '2025-05-08 14:30',
      completed: true,
      current: false
    },
    {
      status: 'Order Processed',
      location: 'Warehouse',
      timestamp: '2025-05-09 10:15',
      completed: true,
      current: false
    },
    {
      status: 'Shipped',
      location: 'Distribution Center',
      timestamp: '2025-05-10 08:45',
      completed: true,
      current: true
    },
    {
      status: 'Out for Delivery',
      location: '',
      timestamp: '',
      completed: false,
      current: false
    },
    {
      status: 'Delivered',
      location: '',
      timestamp: '',
      completed: false,
      current: false
    }
  ]
};

const OrderTracking = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [trackingInput, setTrackingInput] = useState('');

  useEffect(() => {
    // Simulate API call to fetch order details
    const fetchOrder = async () => {
      setIsLoading(true);
      
      try {
        // In a real app, we would fetch the actual order
        // For now, use demo data
        await new Promise(resolve => setTimeout(resolve, 800));
        setOrder(DEMO_ORDER);
      } catch (error) {
        toast.error("Failed to load order details");
        console.error("Error fetching order:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const handleTrackOrder = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (trackingInput.trim()) {
      // In a real app, redirect to the order tracking page with the tracking number
      toast.success(`Tracking order: ${trackingInput}`);
    }
  };

  if (!orderId) {
    // Show tracking form if no orderId is provided
    return (
      <div className="container mx-auto py-12 px-4 max-w-lg">
        <div className="mb-8 text-center">
          <Package className="h-12 w-12 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Track Your Order</h1>
          <p className="text-muted-foreground">
            Enter your order ID or tracking number to get the latest status
          </p>
        </div>
        
        <Card>
          <form onSubmit={handleTrackOrder}>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Input 
                    placeholder="Order ID or Tracking Number"
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full">
                Track Order
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        <div className="mt-8 text-center">
          <Button variant="link" onClick={() => navigate('/orders')}>
            View All Orders
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded mx-auto mb-8"></div>
          <div className="h-64 max-w-xl mx-auto bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Order Not Found</h2>
        <p className="text-muted-foreground mb-8">
          We couldn't find the order you're looking for.
        </p>
        <Button onClick={() => navigate('/orders')}>
          View All Orders
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" className="mb-6" onClick={() => navigate('/orders')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>
        
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl mb-1">Order {order.id}</CardTitle>
                <CardDescription className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Ordered on {new Date(order.shippedDate).toLocaleDateString()}
                </CardDescription>
              </div>
              <div className="text-right">
                <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                  order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                  order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {order.status === 'shipped' && (
                    <span className="flex items-center justify-end">
                      <Calendar className="h-3 w-3 mr-1" />
                      Expected: {new Date(order.estimatedDelivery).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-1/3">
                {/* Product Info */}
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                    <img 
                      src={order.productImage} 
                      alt={order.productName}
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="ml-4">
                    <h4 className="font-medium">{order.productName}</h4>
                    {order.isGift && (
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <Gift className="h-3 w-3 mr-1" />
                        <span>Gift for {order.recipientName}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Tracking Info */}
                <div className="border rounded-md p-4 mb-4">
                  <h4 className="font-medium mb-2 flex items-center">
                    <Package className="h-4 w-4 mr-2" />
                    Tracking Information
                  </h4>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Carrier:</span> {order.carrier}
                  </p>
                  <p className="text-sm break-all">
                    <span className="text-muted-foreground">Tracking #:</span> {order.trackingNumber}
                  </p>
                  <Button variant="link" className="p-0 h-auto text-sm" onClick={() => window.open(`https://www.google.com/search?q=${order.trackingNumber}`, '_blank')}>
                    Track on {order.carrier} website
                  </Button>
                </div>
                
                {/* Delivery Address */}
                <div className="border rounded-md p-4">
                  <h4 className="font-medium mb-2 flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Delivery Address
                  </h4>
                  <p className="text-sm">
                    {order.recipientName || 'John Doe'}<br />
                    123 Main Street<br />
                    Anytown, CA 12345<br />
                    United States
                  </p>
                </div>
              </div>
              
              <div className="w-full md:w-2/3">
                {/* Tracking Timeline */}
                <h3 className="font-semibold mb-4">Tracking Timeline</h3>
                <div className="space-y-3">
                  {order.steps.map((step, index) => (
                    <div key={index} className="flex">
                      <div className="mr-4 relative">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          step.completed 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {step.status === 'Order Placed' && <Clock className="h-4 w-4" />}
                          {step.status === 'Order Processed' && <PackageOpen className="h-4 w-4" />}
                          {step.status === 'Shipped' && <Package className="h-4 w-4" />}
                          {step.status === 'Out for Delivery' && <Truck className="h-4 w-4" />}
                          {step.status === 'Delivered' && <CheckCircle2 className="h-4 w-4" />}
                        </div>
                        
                        {index < order.steps.length - 1 && (
                          <div className={`absolute left-4 top-8 w-0.5 h-8 ${
                            step.completed ? 'bg-primary' : 'bg-muted'
                          }`}></div>
                        )}
                      </div>
                      
                      <div className="flex-1 pb-8">
                        <div className="font-medium">{step.status}</div>
                        
                        {step.completed && (
                          <div className="text-sm text-muted-foreground mt-1">
                            <div>{step.timestamp}</div>
                            {step.location && <div>{step.location}</div>}
                          </div>
                        )}
                        
                        {step.current && (
                          <div className="mt-1 text-sm text-primary font-medium">
                            Current Status
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="text-center">
          <h3 className="font-medium mb-2">Need Help?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            If you have any questions about your order, please contact us.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline">Contact Support</Button>
            <Button variant="outline">Report an Issue</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
