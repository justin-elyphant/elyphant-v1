
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Facebook } from "lucide-react";
import { toast } from "sonner";
import { hasFacebookAuth, connectWithFacebookFriends } from "@/utils/socialUtils";
import { useAuth } from "@/contexts/auth";

const FacebookContactsButton = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  // Check if user has Facebook auth connected
  React.useEffect(() => {
    const checkFacebookAuth = async () => {
      if (user) {
        const hasAuth = await hasFacebookAuth();
        setIsConnected(hasAuth);
      }
    };
    
    checkFacebookAuth();
  }, [user]);

  const handleConnectFacebook = async () => {
    try {
      setIsLoading(true);
      
      const success = await connectWithFacebookFriends();
      
      if (success) {
        setIsConnected(true);
        toast.success("Successfully connected with Facebook friends");
      }
    } catch (error) {
      console.error("Error connecting with Facebook:", error);
      toast.error("Failed to connect with Facebook");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      className="w-full flex items-center gap-2 bg-facebook hover:bg-facebook/90 text-white"
      onClick={handleConnectFacebook}
      disabled={isLoading || isConnected}
    >
      <Facebook className="h-4 w-4" />
      {isConnected 
        ? "Connected with Facebook" 
        : isLoading 
          ? "Connecting..." 
          : "Find Facebook Friends"}
    </Button>
  );
};

export default FacebookContactsButton;
