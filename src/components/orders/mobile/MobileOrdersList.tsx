import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
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

interface MobileOrdersListProps {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  onOrderUpdated?: () => void;
}

const MobileOrdersList = ({ orders, isLoading, error, onOrderUpdated }: MobileOrdersListProps) => {
  if (isLoading) {
    return (
      <div className="space-y-4 pb-safe-or-6" 
        style={{ 
          paddingBottom: 'max(1.5rem, calc(env(safe-area-inset-bottom, 0px) + 4rem))' 
        }}
      >
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="w-full">
            <CardContent className="p-4 space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
              <Skeleton className="h-6 w-24" />
              <div className="flex gap-3 pt-2">
                <Skeleton className="h-11 flex-1" />
                <Skeleton className="h-11 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center pb-safe-or-6"
        style={{ 
          paddingBottom: 'max(2rem, calc(env(safe-area-inset-bottom, 0px) + 4rem))' 
        }}
      >
        <p className="text-red-500 mb-2">{error}</p>
        <p className="text-muted-foreground">Please try again later.</p>
      </div>
    );
  }

  if (orders.length === 0) {
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
      {orders.map((order) => (
        <MobileOrderCard 
          key={order.id} 
          order={order} 
          onOrderUpdated={onOrderUpdated}
        />
      ))}
    </div>
  );
};

export default MobileOrdersList;