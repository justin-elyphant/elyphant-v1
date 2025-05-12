
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Facebook, UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { hasFacebookAuth, connectWithFacebookFriends } from "@/utils/socialUtils";
import { useAuth } from "@/contexts/auth";
import ContextualHelp from "@/components/help/ContextualHelp";

const FacebookContactsButton = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [friendsCount, setFriendsCount] = useState<number | null>(null);
  
  // Check if user has Facebook auth connected
  useEffect(() => {
    const checkFacebookAuth = async () => {
      if (user) {
        const hasAuth = await hasFacebookAuth();
        setIsConnected(hasAuth);
        
        // If connected, try to get friends count
        if (hasAuth) {
          try {
            // The issue is here - we were passing an argument to connectWithFacebookFriends
            // but the function doesn't expect any arguments based on the error
            const friends = await connectWithFacebookFriends();
            if (friends && Array.isArray(friends)) {
              setFriendsCount(friends.length);
            }
          } catch (error) {
            console.error("Error checking Facebook friends count:", error);
          }
        }
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
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium">Facebook Friends</span>
        <ContextualHelp 
          id="facebook-friends-help"
          title="Connect with Facebook Friends"
          content="Connect your Facebook account to find friends who are already using the app. We'll only access your friends list and won't post to Facebook."
          side="left"
        />
      </div>
      <Button 
        variant="outline" 
        className="w-full flex items-center gap-2 bg-facebook hover:bg-facebook/90 text-white"
        onClick={handleConnectFacebook}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Facebook className="h-4 w-4" />
        )}
        {isConnected 
          ? `Connected${friendsCount !== null ? ` (${friendsCount} friends)` : ''}` 
          : isLoading 
            ? "Connecting..." 
            : "Find Facebook Friends"}
      </Button>
    </div>
  );
};

export default FacebookContactsButton;
