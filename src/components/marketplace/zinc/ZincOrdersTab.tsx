
import React, { useState } from "react";
import { useOrders } from "./hooks/useOrders";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import OrderCard from "./components/OrderCard";
import OrdersHeader from "./components/OrdersHeader";

const ZincOrdersTab = () => {
  const { orders, loading, addOrder } = useOrders();
  const [hasAmazonCredentials, setHasAmazonCredentials] = useState(false);
  
  // Placeholder handlers that will be implemented properly later
  const handleManageCredentials = () => {
    console.log("Managing credentials");
    // In a real implementation, this would open the credentials modal
  };
  
  const openTestPurchase = () => {
    console.log("Opening test purchase");
    // In a real implementation, this would open the test purchase modal
  };
  
  const handleProcessOrder = (orderId: string) => {
    console.log("Processing order:", orderId);
    // In a real implementation, this would process the order
  };

  return (
    <div className="space-y-4 py-4">
      <OrdersHeader 
        hasAmazonCredentials={hasAmazonCredentials}
        onManageCredentials={handleManageCredentials}
        onOpenTestPurchase={openTestPurchase}
      />
      
      {orders.length === 0 && !loading && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Orders</AlertTitle>
          <AlertDescription>
            You don't have any orders yet. Use the "Test Purchase" button to create one.
          </AlertDescription>
        </Alert>
      )}
      
      {orders.map(order => (
        <OrderCard 
          key={order.id} 
          order={order} 
          onProcessOrder={() => handleProcessOrder(order.id)}
          hasAmazonCredentials={hasAmazonCredentials}
        />
      ))}
    </div>
  );
};

export default ZincOrdersTab;
