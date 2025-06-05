
import React from "react";
import { useOrders } from "./hooks/useOrders";
import OrderCard from "./components/OrderCard";
import OrdersHeader from "./components/OrdersHeader";
import TestPurchaseDialog from "./components/TestPurchaseDialog";

const ZincOrdersTab = () => {
  const {
    orders,
    isTestPurchaseModalOpen,
    setIsTestPurchaseModalOpen,
    testProductId,
    setTestProductId,
    isProcessing,
    isSimulatedTest,
    setIsSimulatedTest,
    handleProcessOrder,
    openTestPurchaseModal,
    handleTestPurchase
  } = useOrders();

  return (
    <div className="space-y-4 py-4">
      <OrdersHeader 
        onOpenTestPurchase={openTestPurchaseModal}
      />
      
      {orders.map(order => (
        <OrderCard 
          key={order.id} 
          order={order} 
          onProcessOrder={handleProcessOrder}
        />
      ))}
      
      <TestPurchaseDialog
        isOpen={isTestPurchaseModalOpen}
        onOpenChange={setIsTestPurchaseModalOpen}
        testProductId={testProductId}
        setTestProductId={setTestProductId}
        isSimulatedTest={isSimulatedTest}
        setIsSimulatedTest={setIsSimulatedTest}
        isProcessing={isProcessing}
        onTestPurchase={handleTestPurchase}
      />
    </div>
  );
};

export default ZincOrdersTab;
