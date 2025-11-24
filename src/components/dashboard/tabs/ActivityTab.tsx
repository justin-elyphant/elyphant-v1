import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, ShoppingBag, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { Link } from "react-router-dom";

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  created_at: string;
}

const ActivityTab = () => {
  const { user } = useAuth();
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const fetchRecentOrders = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, total_amount, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error && data) {
        setRecentOrders(data);
      }
      setLoading(false);
    };

    fetchRecentOrders();
  }, [user]);

  if (loading) {
    return <div className="text-muted-foreground">Loading activity...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Recent Activity</h2>
        <p className="text-muted-foreground">Your latest orders and purchases</p>
      </div>

      {recentOrders.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No recent activity</h3>
            <p className="text-muted-foreground mb-4">
              Start shopping to see your activity here
            </p>
            <Button asChild>
              <Link to="/marketplace">Browse Products</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {recentOrders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Order #{order.order_number}
                  </CardTitle>
                  <span className="text-sm font-semibold">
                    ${(order.total_amount / 100).toFixed(2)}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(order.created_at).toLocaleDateString()}
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/orders/${order.id}`}>View Details</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          <Button variant="outline" className="w-full" asChild>
            <Link to="/orders">View All Orders</Link>
          </Button>
        </div>
      )}
    </div>
  );
};

export default ActivityTab;
