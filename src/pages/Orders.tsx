
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";
import { 
  Card,
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { getMockOrders } from "@/components/marketplace/zinc/orderService";
import OrdersHeader from "@/components/orders/OrdersHeader";
import OrdersTable from "@/components/orders/OrdersTable";
import { useOrderSort } from "@/components/orders/hooks/useOrderSort";

const Orders = () => {
  const [userData] = useLocalStorage("userData", null);
  const navigate = useNavigate();
  const [orders, setOrders] = useState(getMockOrders());
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Use our custom hook for sorting
  const { sortField, sortDirection, handleSort, getSortIcon, sortedOrders } = useOrderSort(orders);

  // Redirect to sign-up if not logged in
  React.useEffect(() => {
    if (!userData) {
      navigate("/sign-up");
    }
  }, [userData, navigate]);

  const refreshOrders = () => {
    setIsRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setOrders(getMockOrders());
      setIsRefreshing(false);
    }, 800);
  };

  if (!userData) {
    return null; // Don't render anything while redirecting
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <OrdersHeader refreshOrders={refreshOrders} isRefreshing={isRefreshing} />

      {/* Order list */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>
            Showing {orders.length} order{orders.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrdersTable 
            orders={sortedOrders} 
            sortField={sortField}
            sortDirection={sortDirection}
            handleSort={handleSort}
            getSortIcon={getSortIcon}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Orders;
