import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import DashboardSectionHeader from "../DashboardSectionHeader";

interface Order {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  line_items: any;
}

const RecentOrderWidget = () => {
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentOrder = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("id, order_number, status, created_at, line_items")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        setOrder(data);
      } catch (error) {
        console.error("Error fetching recent order:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentOrder();
  }, [user]);

  if (loading) {
    return (
      <div>
        <DashboardSectionHeader 
          title="Recent purchase" 
          viewAllLink="/orders" 
          viewAllText="View all purchases"
        />
        <Card>
          <CardContent className="pt-6">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-3 bg-muted rounded w-1/4" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) {
    return (
      <div>
        <DashboardSectionHeader 
          title="Recent purchase" 
          viewAllLink="/orders" 
          viewAllText="View all purchases"
        />
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">No orders yet</p>
              <Button asChild size="sm">
                <Link to="/shop">Start Shopping</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const itemCount = order.line_items?.items?.length || 0;
  const statusText = order.status.charAt(0).toUpperCase() + order.status.slice(1);
  
  // Show last 4 characters of order number for cleaner mobile display
  const shortOrderNumber = order.order_number?.slice(-4) || order.order_number;

  return (
    <div>
      <DashboardSectionHeader 
        title="Recent purchase" 
        viewAllLink="/orders" 
        viewAllText="View all"
      />
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 flex-1 min-w-0">
              <p className="font-medium">Order #{shortOrderNumber}</p>
              <p className="text-sm text-muted-foreground">{statusText} • {itemCount} {itemCount === 1 ? 'item' : 'items'}</p>
              <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
            </div>
            <Button variant="outline" size="sm" className="min-h-[44px] shrink-0" asChild>
              <Link to={`/orders/${order.id}`}>Details</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecentOrderWidget;
