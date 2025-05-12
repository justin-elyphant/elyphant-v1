
import React from 'react';
import { toast } from 'sonner';
import { Package, Truck, CheckCircle, Calendar, AlertTriangle, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type OrderStatus = 
  | 'created'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'delayed'
  | 'cancelled';

interface OrderStatusNotificationProps {
  orderId: string;
  status: OrderStatus;
  productName?: string;
  estimatedDelivery?: string;
  recipientName?: string;
}

export const showOrderStatusNotification = ({
  orderId,
  status,
  productName = 'your item',
  estimatedDelivery,
  recipientName
}: OrderStatusNotificationProps) => {
  
  const getIcon = (): LucideIcon => {
    switch (status) {
      case 'created': return Package;
      case 'processing': return Package;
      case 'shipped': return Truck;
      case 'delivered': return CheckCircle;
      case 'delayed': return AlertTriangle;
      case 'cancelled': return AlertTriangle;
      default: return Package;
    }
  };
  
  const getTitle = () => {
    switch (status) {
      case 'created': return 'Order Confirmed';
      case 'processing': return 'Order Processing';
      case 'shipped': return 'Order Shipped';
      case 'delivered': return 'Order Delivered';
      case 'delayed': return 'Delivery Delayed';
      case 'cancelled': return 'Order Cancelled';
      default: return 'Order Update';
    }
  };
  
  const getMessage = () => {
    const recipient = recipientName ? ` for ${recipientName}` : '';
    
    switch (status) {
      case 'created': 
        return `Your order for ${productName}${recipient} has been confirmed.`;
      case 'processing': 
        return `Your order for ${productName}${recipient} is being processed.`;
      case 'shipped': 
        return `${productName}${recipient} has been shipped! ${estimatedDelivery ? `Estimated delivery: ${estimatedDelivery}` : ''}`;
      case 'delivered': 
        return `${productName}${recipient} has been delivered!`;
      case 'delayed': 
        return `There's a delay with your ${productName}${recipient} order. ${estimatedDelivery ? `New estimated delivery: ${estimatedDelivery}` : ''}`;
      case 'cancelled': 
        return `Your order for ${productName}${recipient} has been cancelled.`;
      default: 
        return `Your order for ${productName}${recipient} has been updated.`;
    }
  };
  
  const getToastType = () => {
    switch (status) {
      case 'delivered': return 'success';
      case 'delayed': 
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };
  
  const handleTrackOrder = () => {
    // In the future this would navigate to an order tracking page
    window.location.href = `/orders/${orderId}`;
  };
  
  const Icon = getIcon();
  const toastType = getToastType();
  
  // Use the correct way to set toast type in sonner
  if (toastType === 'success') {
    toast.success(getTitle(), {
      description: getMessage(),
      icon: <Icon />,
      action: {
        label: "Track Order",
        onClick: handleTrackOrder
      },
      duration: 6000,
    });
  } else if (toastType === 'error') {
    toast.error(getTitle(), {
      description: getMessage(),
      icon: <Icon />,
      action: {
        label: "Track Order",
        onClick: handleTrackOrder
      },
      duration: 6000,
    });
  } else {
    toast(getTitle(), {
      description: getMessage(),
      icon: <Icon />,
      action: {
        label: "Track Order",
        onClick: handleTrackOrder
      },
      duration: 6000,
    });
  }
};

// Example usage component with demo buttons
export const OrderNotificationDemo = () => {
  const mockOrderId = "ORD-123456";
  
  return (
    <div className="space-y-4 p-4 border rounded-md">
      <h3 className="font-medium text-lg">Order Status Notification Demo</h3>
      <p className="text-sm text-muted-foreground">
        Click the buttons below to see different order status notifications.
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => showOrderStatusNotification({
            orderId: mockOrderId,
            status: 'created',
            productName: 'Coffee Maker',
          })}
        >
          Order Created
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => showOrderStatusNotification({
            orderId: mockOrderId,
            status: 'processing',
            productName: 'Coffee Maker',
          })}
        >
          Processing
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => showOrderStatusNotification({
            orderId: mockOrderId,
            status: 'shipped',
            productName: 'Coffee Maker',
            estimatedDelivery: 'May 15, 2025',
          })}
        >
          Shipped
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => showOrderStatusNotification({
            orderId: mockOrderId,
            status: 'delivered',
            productName: 'Coffee Maker',
          })}
        >
          Delivered
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => showOrderStatusNotification({
            orderId: mockOrderId,
            status: 'delayed',
            productName: 'Coffee Maker',
            estimatedDelivery: 'May 20, 2025',
          })}
        >
          Delayed
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => showOrderStatusNotification({
            orderId: mockOrderId,
            status: 'cancelled',
            productName: 'Coffee Maker',
          })}
        >
          Cancelled
        </Button>
      </div>
    </div>
  );
};
