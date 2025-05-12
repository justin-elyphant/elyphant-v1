
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { toast } from 'sonner';

export const EmailContactsButton = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleImportContacts = async () => {
    setIsLoading(true);
    
    try {
      // This would be replaced with actual API call in production
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success('Email contacts imported', {
        description: 'Successfully connected with your email contacts',
      });
    } catch (error) {
      console.error('Error importing email contacts:', error);
      toast.error('Failed to import contacts', {
        description: 'There was an error connecting to your email',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleImportContacts} 
      disabled={isLoading} 
      className="w-full"
    >
      <Mail className="mr-2 h-4 w-4" />
      {isLoading ? "Importing..." : "Import Email Contacts"}
    </Button>
  );
};
