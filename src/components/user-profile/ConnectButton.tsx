import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useDirectConnect } from "@/hooks/useDirectConnect";
import { UserPlus, UserMinus, Clock, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConnectButtonProps {
  targetUserId: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  className?: string;
}

const ConnectButton: React.FC<ConnectButtonProps> = ({
  targetUserId,
  variant = "default",
  size = "default",
  className
}) => {
  const {
    connectState,
    loading,
    checkConnectionStatus,
    sendConnectionRequest,
    removeConnection
  } = useDirectConnect(targetUserId);

  useEffect(() => {
    checkConnectionStatus();
  }, [checkConnectionStatus]);

  const handleClick = () => {
    if (connectState.isConnected) {
      removeConnection();
    } else if (!connectState.isPending) {
      sendConnectionRequest();
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
          <Clock className="h-4 w-4 mr-2 animate-spin" />
          Loading...
        </>
      );
    }

    if (connectState.isConnected) {
      return (
        <>
          <UserCheck className="h-4 w-4 mr-2" />
          Connected
        </>
      );
    }

    if (connectState.isPending) {
      return (
        <>
          <Clock className="h-4 w-4 mr-2" />
          Request Sent
        </>
      );
    }

    return (
      <>
        <UserPlus className="h-4 w-4 mr-2" />
        Connect
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