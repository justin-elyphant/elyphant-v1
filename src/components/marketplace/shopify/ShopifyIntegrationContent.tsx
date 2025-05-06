
import React from "react";
import ConnectionStatus from "./ConnectionStatus";
import SyncSettingsPanel from "./SyncSettingsPanel";
import ProductCatalog from "../ProductCatalog";
import { Product } from "@/contexts/ProductContext";
import { SyncSettings } from "./useShopifyIntegration";

interface ShopifyIntegrationContentProps {
  shopifyUrl: string;
  isLoading: boolean;
  products: Product[];
  lastSyncTime: Date | null;
  syncSettings: SyncSettings;
  onDisconnect: () => void;
  onSyncNow: () => void;
  onSyncSettingChange: (key: string, value: any) => void;
}

const ShopifyIntegrationContent: React.FC<ShopifyIntegrationContentProps> = ({
  shopifyUrl,
  isLoading,
  products,
  lastSyncTime,
  syncSettings,
  onDisconnect,
  onSyncNow,
  onSyncSettingChange
}) => {
  return (
    <div className="space-y-6">
      <ConnectionStatus 
        shopifyUrl={shopifyUrl} 
        onDisconnect={onDisconnect} 
        isLoading={isLoading} 
      />
      
      <SyncSettingsPanel 
        products={products}
        lastSyncTime={lastSyncTime}
        syncSettings={syncSettings}
        onSyncSettingChange={onSyncSettingChange}
        onSyncNow={onSyncNow}
        isLoading={isLoading}
      />
      
      <ProductCatalog products={products} />
    </div>
  );
};

export default ShopifyIntegrationContent;
