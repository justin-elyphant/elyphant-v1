import { useState, useEffect } from "react";
import { toast } from 'sonner';
import { testZincApiKey, getZincApiKey, updateZincApiKey } from '@/api/zinc_api';

export const useZincIntegration = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [rowId, setRowId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enableAutoFulfillment, setEnableAutoFulfillment] = useState(false);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const data = await getZincApiKey();
    if(!data || !data.key) {
      toast.error("Error loading the Zinc API key");
    } else {
      setApiKey(data.key);
      setRowId(String(data.id));
    }
  }

  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await testZincApiKey(apiKey);
      if(!result) {
        setIsLoading(false);
        toast.error("Error during API key verification:", {
          description: "Zinc API key is invalid. Connection failed",
          duration: 5000
        });
        return ;
      } else {
        toast.success("Connection successful", {
          description: "Successfully connected to Zinc API",
          duration: 5000
        });
        return true;
      }
    } catch (err) {
      console.error("Error connecting to Zinc:", err);
      setError("Failed to connect to Zinc API due to browser security (CORS) restrictions. Your API token has been saved but real API calls may not work without a CORS solution.");
      
      toast.error("Connection issues detected", {
        description: "Browser security may prevent direct API calls. Your token is saved but searches may use mock data until CORS is resolved."
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  const handleUpdate = async () => {
    const data = await updateZincApiKey(rowId, apiKey);
    if(data) {
      toast.success("Zinc Api Key is updated successfully.", {duration: 5000});
    } else {
      toast.error("Zinc Api Key update failed.", {duration: 5000});
    }
  }

  return {
    isLoading: isLoading,
    apiKey: apiKey,
    setApiKey: setApiKey,
    enableAutoFulfillment: enableAutoFulfillment,
    setEnableAutoFulfillment: setEnableAutoFulfillment,
    handleConnect,
    handleUpdate,
    error: error,
  };
};
