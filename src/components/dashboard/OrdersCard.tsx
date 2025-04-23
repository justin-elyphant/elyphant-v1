
import React from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const OrdersCard = () => {
  // Mock recent orders data
  const recentOrders = [
    { id: "ORD-123", status: "delivered", date: "Apr 20", total: "$75.99" },
    { id: "ORD-124", status: "shipped", date: "Apr 22", total: "$45.50" },
  ];

  return (
    <Card>
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
                <div key={order.id} className="flex justify-between items-center text-sm">
                  <div>
                    <p className="font-medium">{order.id}</p>
                    <p className="text-muted-foreground">{order.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{order.total}</p>
                    <Badge variant={order.status === "delivered" ? "default" : "secondary"} className="text-xs">
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
