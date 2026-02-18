import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  MapPin, 
  ArrowLeft, 
  Clock, 
  Calendar, 
  Gift,
  EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth';
import { useToast } from '@/hooks/use-toast';
import SimplifiedOrderTimeline from './SimplifiedOrderTimeline';

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
  trackingAccess?: {
    access_level: string;
    can_view_tracking: string;
    can_view_delivery_address: boolean;
    notification_preferences?: any;
  };
}

interface EnhancedOrderTrackingProps {
  orderId?: string;
}

const EnhancedOrderTracking = ({ orderId: propOrderId }: EnhancedOrderTrackingProps) => {
  const { orderId: paramOrderId } = useParams<{ orderId: string }>();
  const orderId = propOrderId || paramOrderId;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Demo data - in real app, this would come from API
  const DEMO_ORDER: OrderDetails = {
    id: 'ORD-12345',
    status: 'shipped',
    trackingNumber: '9400123456789012345678',
    carrier: 'USPS',
    estimatedDelivery: '2025-05-15',
    shippedDate: '2025-05-10',
    isGift: true,
    recipientName: 'Sarah Johnson',
    productName: 'Premium Bluetooth Headphones',
    productImage: 'https://picsum.photos/200/300?random=2',
    trackingAccess: {
      access_level: 'full',
      can_view_tracking: 'yes',
      can_view_delivery_address: false
    },
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
        timestamp: '2025-05-09 18:15',
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

  useEffect(() => {
    const fetchOrder = async () => {
      setIsLoading(true);
      try {
        // Simulate API call - in real app, fetch actual order data
        await new Promise(resolve => setTimeout(resolve, 800));
        setOrder(DEMO_ORDER);
      } catch (error) {
        console.error('Error fetching order:', error);
        toast("Failed to load order details");
      } finally {
        setIsLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId, toast]);

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

  const canViewTracking = order.trackingAccess?.can_view_tracking === 'yes';
  const canViewAddress = order.trackingAccess?.can_view_delivery_address;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate('/orders')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </div>
        
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl mb-1">
                  Order {order.id}
                </CardTitle>
                <CardDescription className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Ordered on {new Date(order.shippedDate).toLocaleDateString()}
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-foreground">
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
                {canViewTracking && (
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
                )}
                
                {/* Delivery Address */}
                {canViewAddress && (
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
                )}

                {!canViewTracking && (
                  <div className="border rounded-md p-4 bg-muted/20">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <EyeOff className="h-4 w-4" />
                      <span className="text-sm">Tracking details are restricted</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="w-full md:w-2/3">
                {/* Tracking Timeline */}
                {canViewTracking ? (
                  <>
                    <h3 className="font-semibold mb-6">Tracking Timeline</h3>
                    <SimplifiedOrderTimeline steps={order.steps} />
                  </>
                ) : (
                  <div className="text-center py-12">
                    <EyeOff className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-medium mb-2">Tracking Access Restricted</h3>
                    <p className="text-sm text-muted-foreground">
                      You don't have permission to view detailed tracking information for this order.
                    </p>
                  </div>
                )}
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

export default EnhancedOrderTracking;
