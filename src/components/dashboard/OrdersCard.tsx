
import React from "react";
import { Link } from "react-router-dom";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const OrdersCard = () => {
  // Mock recent orders data
  const recentOrders = [
    { id: "ORD-1234", status: "delivered", date: "Apr 28", total: "$75.99" },
    { id: "ORD-1235", status: "shipped", date: "May 2", total: "$45.50" },
    { id: "ORD-1236", status: "processing", date: "May 5", total: "$129.99" },
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center">
          <Package className="h-5 w-5 mr-2 text-emerald-500" />
          My Orders
        </CardTitle>
        <CardDescription className="text-sm">
          Track your recent gifts and purchases
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex justify-between items-center text-sm pb-2 border-b last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium">{order.id}</p>
                    <p className="text-muted-foreground text-xs">{order.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{order.total}</p>
                    <Badge 
                      variant={order.status === "delivered" ? "default" : order.status === "shipped" ? "secondary" : "outline"} 
                      className="text-xs px-1.5 py-0.5 h-5">
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No recent orders</p>
          )}
          <Button className="w-full" size="sm" asChild>
            <Link to="/orders">View All Orders</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrdersCard;
