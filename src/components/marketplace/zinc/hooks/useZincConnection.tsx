
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { testZincApiKey, getZincApiKey, updateZincApiKey } from '@/api/zinc_api';

export const useZincConnection = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [rowId, setRowId] = useState("");
  const [enableAutoFulfillment, setEnableAutoFulfillment] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for existing Zinc connection in localStorage
  useEffect(() => {
    init();
  }, []);
  const init = async () => {
    const data = await getZincApiKey();
    if(!data.key) {
      toast.error("loading the zinc api key");
    } else {
      // setZincApiToken(data.key);
      setApiKey(data.key);
      // setRowId(data.);
    }

  }
  const handleUpdate = async () => {
    const data = await updateZincApiKey(rowId, apiKey);
    if(data) {
      toast.success("Zinc Api Key is updated successfully.", {duration: 5000});
    } else {
      toast.error("Zinc Api Key update failed.", {duration: 5000});
    }
  }

  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Create connection info in localStorage immediately
      // This allows us to "connect" even if API verification fails
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

  return {
    isLoading,
    apiKey,
    setApiKey,
    enableAutoFulfillment,
    setEnableAutoFulfillment,
    handleConnect,
    handleUpdate,
    error,
    setError,
    setIsLoading,
  };
};
