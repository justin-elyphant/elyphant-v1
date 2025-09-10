import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useDirectConnect } from "@/hooks/useDirectConnect";
import { useConnectionRequestDebugger } from "@/hooks/useConnectionRequestDebugger";
import { UserPlus, UserMinus, Clock, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConnectButtonProps {
  targetUserId: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg" | "icon";
  className?: string;
  iconOnly?: boolean;
}

const ConnectButton: React.FC<ConnectButtonProps> = ({
  targetUserId,
  variant = "default",
  size = "default",
  className,
  iconOnly = false
}) => {
  const {
    connectState,
    loading,
    checkConnectionStatus,
    sendConnectionRequest,
    removeConnection
  } = useDirectConnect(targetUserId);
  
  const { debugConnectionStatus } = useConnectionRequestDebugger();

  useEffect(() => {
    checkConnectionStatus();
  }, [checkConnectionStatus]);

  // Debug logging for connect button state
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔘 [ConnectButton] State update:', {
        targetUserId,
        connectState,
        loading
      });
    }
  }, [targetUserId, connectState, loading]);

  const handleClick = async () => {
    console.log('🔘 [ConnectButton] Button clicked:', { 
      targetUserId, 
      isConnected: connectState.isConnected, 
      isPending: connectState.isPending 
    });
    
    // Debug connection status before action
    if (process.env.NODE_ENV === 'development' && targetUserId) {
      await debugConnectionStatus(targetUserId);
    }
    
    if (connectState.isConnected) {
      console.log('🔘 [ConnectButton] Removing connection');
      removeConnection();
    } else if (!connectState.isPending) {
      console.log('🔘 [ConnectButton] Sending connection request');
      sendConnectionRequest();
    } else {
      console.log('🔘 [ConnectButton] Request already pending, no action taken');
    }
  };

  // Don't render if can't connect (blocked)
  if (!connectState.canConnect) {
    return null;
  }

  const getButtonContent = () => {
    if (loading) {
      return (
        <>
          <Clock className="h-4 w-4 animate-spin" />
          {!iconOnly && <span className="ml-2">Loading...</span>}
        </>
      );
    }

    if (connectState.isConnected) {
      return (
        <>
          <UserCheck className="h-4 w-4" />
          {!iconOnly && <span className="ml-2">Connected</span>}
        </>
      );
    }

    if (connectState.isPending) {
      return (
        <>
          <Clock className="h-4 w-4" />
          {!iconOnly && <span className="ml-2">Request Sent</span>}
        </>
      );
    }

    return (
      <>
        <UserPlus className="h-4 w-4" />
        {!iconOnly && <span className="ml-2">Connect</span>}
      </>
    );
  };

  const getButtonVariant = () => {
    if (connectState.isConnected) {
      return "outline";
    }
    return variant;
  };

  return (
    <Button
      onClick={handleClick}
      disabled={loading || connectState.isPending}
      variant={getButtonVariant()}
      size={size}
      className={cn(
        connectState.isConnected && "hover:bg-destructive hover:text-destructive-foreground",
        className
      )}
    >
      {getButtonContent()}
    </Button>
  );
};

export default ConnectButton;