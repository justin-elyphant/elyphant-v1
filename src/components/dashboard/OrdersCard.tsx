
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getUserOrders, Order } from "@/services/orderService";
import { useAuth } from "@/contexts/auth";

const OrdersCard = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userOrders = await getUserOrders();
        // Get the 3 most recent orders for the dashboard
        const recentOrders = userOrders.slice(0, 3);
        setOrders(recentOrders);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'default';
      case 'shipped':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (!user) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center">
            <Package className="h-5 w-5 mr-2 text-emerald-500" />
            My Orders
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Track your recent gifts and purchases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">Sign in to view your orders</p>
          <Button className="w-full" size="sm" asChild>
            <Link to="/signin">Sign In</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center">
          <Package className="h-5 w-5 mr-2 text-emerald-500" />
          My Orders
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Track your recent gifts and purchases
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading orders...</p>
          ) : error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : orders.length > 0 ? (
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order.id} className="flex justify-between items-center text-sm pb-2 border-b last:border-0 last:pb-0 dark:border-gray-700">
                  <div>
                    <p className="font-medium">{order.order_number}</p>
                    <p className="text-muted-foreground text-xs">{formatDate(order.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatPrice(order.total_amount)}</p>
                    <Badge 
                      variant={getStatusVariant(order.status)} 
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
