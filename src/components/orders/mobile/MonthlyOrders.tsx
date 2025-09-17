import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Calendar } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import MobileOrderCard from "./MobileOrderCard";

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  user_id: string;
  order_number?: string;
  stripe_payment_intent_id?: string;
  stripe_session_id?: string;
}

interface MonthlyOrdersProps {
  orders: Order[];
  onOrderUpdated?: () => void;
}

interface GroupedOrders {
  [key: string]: Order[];
}

const MonthlyOrders = ({ orders, onOrderUpdated }: MonthlyOrdersProps) => {
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  // Group orders by month and year
  const groupOrdersByMonth = (orders: Order[]): GroupedOrders => {
    const grouped: GroupedOrders = {};
    
    orders.forEach(order => {
      const date = new Date(order.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(order);
    });

    return grouped;
  };

  const groupedOrders = groupOrdersByMonth(orders);
  const sortedMonthKeys = Object.keys(groupedOrders).sort((a, b) => b.localeCompare(a)); // Most recent first

  const formatMonthYear = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const getTotalSpent = (orders: Order[]) => {
    return orders.reduce((total, order) => total + order.total_amount, 0);
  };

  const toggleMonth = (monthKey: string) => {
    const newExpanded = new Set(expandedMonths);
    if (newExpanded.has(monthKey)) {
      newExpanded.delete(monthKey);
    } else {
      newExpanded.add(monthKey);
    }
    setExpandedMonths(newExpanded);
  };

  // Auto-expand current month
  React.useEffect(() => {
    const currentMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    if (groupedOrders[currentMonthKey]) {
      setExpandedMonths(prev => new Set([...prev, currentMonthKey]));
    }
  }, []);

  if (sortedMonthKeys.length === 0) {
    return (
      <div className="p-8 text-center border rounded-lg pb-safe-or-6"
        style={{ 
          paddingBottom: 'max(2rem, calc(env(safe-area-inset-bottom, 0px) + 4rem))' 
        }}
      >
        <p className="text-lg font-medium mb-2">No orders found</p>
        <p className="text-muted-foreground">You haven't placed any orders yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-safe-or-6" 
      style={{ 
        paddingBottom: 'max(1.5rem, calc(env(safe-area-inset-bottom, 0px) + 4rem))' 
      }}
    >
      {sortedMonthKeys.map((monthKey) => {
        const monthOrders = groupedOrders[monthKey];
        const isExpanded = expandedMonths.has(monthKey);
        const totalSpent = getTotalSpent(monthOrders);
        
        return (
          <Collapsible
            key={monthKey}
            open={isExpanded}
            onOpenChange={() => toggleMonth(monthKey)}
          >
            <Card className="w-full">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                      <Calendar className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle className="text-lg">
                          {formatMonthYear(monthKey)}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {monthOrders.length} {monthOrders.length === 1 ? 'order' : 'orders'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">
                        ${totalSpent.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        total spent
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="pt-0 space-y-4">
                  {monthOrders.map((order) => (
                    <MobileOrderCard 
                      key={order.id} 
                      order={order} 
                      onOrderUpdated={onOrderUpdated}
                    />
                  ))}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}
    </div>
  );
};

export default MonthlyOrders;