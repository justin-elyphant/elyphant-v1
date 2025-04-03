
import { useZincConnection, useZincProducts } from './hooks';

export const useZincIntegration = () => {
  const connection = useZincConnection();
  const products = useZincProducts();

  const handleConnect = async () => {
    const success = await connection.handleConnect();
    if (success) {
      // Load initial Amazon products on successful connection
      await products.syncProducts();
    }
  };

  return {
    // Connection properties and methods
    isConnected: connection.isConnected,
    isLoading: connection.isLoading || products.isLoading,
    apiKey: connection.apiKey,
    setApiKey: connection.setApiKey,
    enableAutoFulfillment: connection.enableAutoFulfillment,
    setEnableAutoFulfillment: connection.setEnableAutoFulfillment,
    handleConnect,
    handleDisconnect: connection.handleDisconnect,
    lastSync: connection.lastSync,
    error: connection.error,
    
    // Product properties and methods
    searchTerm: products.searchTerm,
    setSearchTerm: products.setSearchTerm,
    syncProducts: products.syncProducts,
    handleSearch: products.handleSearch
  };
};
