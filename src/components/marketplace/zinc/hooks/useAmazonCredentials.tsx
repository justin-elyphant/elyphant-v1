
import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { AmazonCredentials } from '../types';

export const useAmazonCredentials = (onSaveCallback?: (credentials: AmazonCredentials) => void) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hasStoredCredentials, setHasStoredCredentials] = useState(false);
  
  // Check if credentials are already stored
  useEffect(() => {
    const storedCredentials = localStorage.getItem('amazonCredentials');
    if (storedCredentials) {
      try {
        const parsedCredentials = JSON.parse(storedCredentials);
        setEmail(parsedCredentials.email || '');
        setPassword(parsedCredentials.password || '');
        setHasStoredCredentials(true);
      } catch (error) {
        console.error("Error parsing stored Amazon credentials:", error);
      }
    }
  }, []);

  const handleSave = () => {
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    const credentials: AmazonCredentials = { email, password };
    
    // Save credentials in localStorage (encrypted in a real app)
    try {
      localStorage.setItem('amazonCredentials', JSON.stringify(credentials));
      if (onSaveCallback) {
        onSaveCallback(credentials);
      }
      toast.success("Amazon credentials saved successfully");
      return true;
    } catch (error) {
      console.error("Error saving Amazon credentials:", error);
      toast.error("Failed to save credentials");
      return false;
    }
  };

  const handleClearCredentials = () => {
    localStorage.removeItem('amazonCredentials');
    setEmail('');
    setPassword('');
    setHasStoredCredentials(false);
    toast.success("Amazon credentials cleared");
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    hasStoredCredentials,
    handleSave,
    handleClearCredentials
  };
};
