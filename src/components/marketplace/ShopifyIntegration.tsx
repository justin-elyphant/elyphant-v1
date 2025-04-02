
import React from "react";
import ConnectShopifyForm from "./shopify/ConnectShopifyForm";
import ShopifyIntegrationContent from "./shopify/ShopifyIntegrationContent";
import { useShopifyIntegration } from "./shopify/useShopifyIntegration";

const ShopifyIntegration = () => {
  const {
    shopifyUrl,
    isConnected,
    isLoading,
    syncSettings,
    products,
    lastSyncTime,
    handleConnect,
    handleDisconnect,
    handleSyncNow,
    handleSyncSettingChange
  } = useShopifyIntegration();
  
  return (
    <div>
      {!isConnected ? (
        <ConnectShopifyForm onConnect={handleConnect} isLoading={isLoading} />
      ) : (
        <ShopifyIntegrationContent
          shopifyUrl={shopifyUrl}
          isLoading={isLoading}
          products={products}
          lastSyncTime={lastSyncTime}
          syncSettings={syncSettings}
          onDisconnect={handleDisconnect}
          onSyncNow={handleSyncNow}
          onSyncSettingChange={handleSyncSettingChange}
        />
      )}
    </div>
  );
};

export default ShopifyIntegration;
