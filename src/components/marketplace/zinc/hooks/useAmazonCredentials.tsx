
import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AmazonCredentials {
  email: string;
  is_verified: boolean;
  last_verified_at?: string;
  created_at?: string;
}

export const useAmazonCredentials = (onSaveCallback?: (credentials: AmazonCredentials) => void) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hasStoredCredentials, setHasStoredCredentials] = useState(false);
  const [credentials, setCredentials] = useState<AmazonCredentials | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load credentials from server on mount
  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-amazon-credentials', {
        body: { action: 'get' }
      });

      if (error) {
        throw error;
      }

      if (data.success && data.credentials) {
        setCredentials(data.credentials);
        setEmail(data.credentials.email);
        setHasStoredCredentials(true);
      } else {
        setHasStoredCredentials(false);
      }
    } catch (error) {
      console.error("Error loading Amazon credentials:", error);
      // Don't show error toast on initial load - credentials might not exist yet
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke('manage-amazon-credentials', {
        body: {
          action: 'save',
          email: email,
          password: password
        }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        await loadCredentials(); // Reload to get updated status
        if (onSaveCallback && credentials) {
          onSaveCallback(credentials);
        }
        toast.success("Amazon credentials saved successfully");
        return true;
      } else {
        throw new Error('Failed to save credentials');
      }
    } catch (error) {
      console.error("Error saving Amazon credentials:", error);
      toast.error("Failed to save credentials");
      return false;
    }
  };

  const handleClearCredentials = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-amazon-credentials', {
        body: { action: 'delete' }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        setCredentials(null);
        setHasStoredCredentials(false);
        setEmail('');
        setPassword('');
        toast.success("Amazon credentials cleared");
      } else {
        throw new Error('Failed to delete credentials');
      }
    } catch (error) {
      console.error("Error clearing Amazon credentials:", error);
      toast.error("Failed to clear credentials");
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    hasStoredCredentials,
    credentials,
    isLoading,
    handleSave,
    handleClearCredentials,
    loadCredentials
  };
};
