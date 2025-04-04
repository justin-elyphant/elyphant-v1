
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Facebook } from "lucide-react";
import { connectWithFacebookFriends, hasFacebookAuth } from "@/utils/socialUtils";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const FacebookContactsButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  // Check if user has Facebook auth connected
  const { data: hasFacebook, isLoading: checkingAuth } = useQuery({
    queryKey: ['hasFacebookAuth'],
    queryFn: hasFacebookAuth,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const handleImportContacts = async () => {
    setIsLoading(true);
    try {
      await connectWithFacebookFriends();
    } catch (error) {
      console.error("Failed to import contacts:", error);
      toast.error("Could not import Facebook contacts");
    } finally {
      setIsLoading(false);
    }
  };
  
  if (checkingAuth) {
    return (
      <Button variant="outline" disabled className="w-full">
        Checking Facebook connection...
      </Button>
    );
  }
  
  if (!hasFacebook) {
    return (
      <Button 
        variant="outline" 
        className="w-full text-gray-500" 
        disabled
      >
        <Facebook className="mr-2 h-4 w-4 text-gray-400" />
        Connect with Facebook to import contacts
      </Button>
    );
  }
  
  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={handleImportContacts}
      disabled={isLoading}
    >
      <Facebook className="mr-2 h-4 w-4 text-blue-600" />
      {isLoading ? "Importing..." : "Import Facebook Contacts"}
    </Button>
  );
};

export default FacebookContactsButton;
