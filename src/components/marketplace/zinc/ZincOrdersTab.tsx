
import React from "react";
import { useOrders } from "./hooks/useOrders";
import AmazonCredentialsManager from "./AmazonCredentialsManager";
import OrderCard from "./components/OrderCard";
import OrdersHeader from "./components/OrdersHeader";
import TestPurchaseDialog from "./components/TestPurchaseDialog";

const ZincOrdersTab = () => {
  const {
    orders,
    isCredentialsModalOpen,
    setIsCredentialsModalOpen,
    isTestPurchaseModalOpen,
    setIsTestPurchaseModalOpen,
    testProductId,
    setTestProductId,
    isProcessing,
    isSimulatedTest,
    setIsSimulatedTest,
    hasAmazonCredentials,
    handleSaveCredentials,
    handleProcessOrder,
    handleManageCredentials,
    openTestPurchaseModal,
    handleTestPurchase
  } = useOrders();

  return (
    <div className="space-y-4 py-4">
      <OrdersHeader 
        hasAmazonCredentials={hasAmazonCredentials}
        onManageCredentials={handleManageCredentials}
        onOpenTestPurchase={openTestPurchaseModal}
      />
      
      {orders.map(order => (
        <OrderCard 
          key={order.id} 
          order={order} 
          onProcessOrder={handleProcessOrder}
          hasAmazonCredentials={hasAmazonCredentials}
        />
      ))}
      
      <AmazonCredentialsManager 
        isOpen={isCredentialsModalOpen}
        onClose={() => setIsCredentialsModalOpen(false)}
        onSave={handleSaveCredentials}
      />

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
