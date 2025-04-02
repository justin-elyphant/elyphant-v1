
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ConnectionStatusProps {
  shopifyUrl: string;
  onDisconnect: () => void;
  isLoading: boolean;
}

const ConnectionStatus = ({ shopifyUrl, onDisconnect, isLoading }: ConnectionStatusProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Badge className="bg-green-500">Connected</Badge>
        <span className="font-medium">{shopifyUrl}</span>
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onDisconnect} 
        disabled={isLoading}
      >
        Disconnect
      </Button>
    </div>
  );
};

export default ConnectionStatus;
