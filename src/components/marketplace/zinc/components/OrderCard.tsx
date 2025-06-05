
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Calendar, DollarSign } from "lucide-react";

interface Order {
  id: string;
  status: string;
  customerName: string;
  date: string;
  items: { name: string; quantity: number; price: number; }[];
  total: number;
}

interface OrderCardProps {
  order: Order;
  onProcessOrder: (orderId: string) => void;
}

const OrderCard = ({ order, onProcessOrder }: OrderCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order #{order.id.slice(-8)}
          </CardTitle>
          <Badge className={getStatusColor(order.status)}>
            {order.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{new Date(order.date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span>${order.total.toFixed(2)}</span>
          </div>
          <div className="text-muted-foreground">
            Customer: {order.customerName}
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Items:</h4>
          <div className="space-y-1">
            {order.items.map((item, index) => (
              <div key={index} className="text-sm text-muted-foreground flex justify-between">
                <span>{item.name} x{item.quantity}</span>
                <span>${item.price.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-end pt-2">
          {order.status === 'pending' && (
            <Button 
              onClick={() => onProcessOrder(order.id)}
              size="sm"
            >
              Process Order
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderCard;
