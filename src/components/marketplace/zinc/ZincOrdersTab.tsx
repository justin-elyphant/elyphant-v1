
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingBag, TruckIcon, Package } from "lucide-react";

// Mock order data
const mockOrders = [
  {
    id: "ord_123456",
    customerName: "Jane Smith",
    items: [
      { name: "Echo Dot (4th Gen)", quantity: 1, price: 49.99 }
    ],
    total: 49.99,
    status: "delivered",
    date: "2025-03-28T14:30:00Z"
  },
  {
    id: "ord_123457",
    customerName: "John Doe",
    items: [
      { name: "Kindle Paperwhite", quantity: 1, price: 139.99 }
    ],
    total: 139.99,
    status: "shipped",
    date: "2025-04-01T10:15:00Z"
  },
  {
    id: "ord_123458",
    customerName: "Alex Johnson",
    items: [
      { name: "Fire TV Stick 4K", quantity: 1, price: 49.99 },
      { name: "AirPods Pro", quantity: 1, price: 249.99 }
    ],
    total: 299.98,
    status: "processing",
    date: "2025-04-02T16:45:00Z"
  }
];

const ZincOrdersTab = () => {
  // Function to get appropriate badge variant based on order status
  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "delivered":
        return "success";
      case "shipped":
        return "info";
      case "processing":
        return "warning";
      default:
        return "default";
    }
  };

  // Function to get icon based on order status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <Package className="h-3 w-3 mr-1" />;
      case "shipped":
        return <TruckIcon className="h-3 w-3 mr-1" />;
      case "processing":
        return <ShoppingBag className="h-3 w-3 mr-1" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 py-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Recent Orders</h3>
        <Button variant="outline" size="sm">View All Orders</Button>
      </div>
      
      {mockOrders.map(order => (
        <Card key={order.id}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base">Order #{order.id.slice(-6)}</CardTitle>
              <Badge variant={getBadgeVariant(order.status) as "success" | "info" | "warning" | "default"} className="flex items-center">
                {getStatusIcon(order.status)}
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Customer:</span>
                <span>{order.customerName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date:</span>
                <span>{new Date(order.date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Items:</span>
                <span>{order.items.reduce((acc, item) => acc + item.quantity, 0)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Total:</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
              
              <div className="pt-2 flex justify-end space-x-2">
                <Button variant="outline" size="sm">Details</Button>
                {order.status === "processing" && (
                  <Button size="sm">Process Now</Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ZincOrdersTab;
