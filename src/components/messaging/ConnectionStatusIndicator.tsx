
import React from "react";
import { cn } from "@/lib/utils";

interface ConnectionStatusIndicatorProps {
  status: "online" | "offline" | "away";
  lastSeen?: string;
  className?: string;
  showText?: boolean;
}

const ConnectionStatusIndicator = ({ 
  status, 
  lastSeen, 
  className, 
  showText = false 
}: ConnectionStatusIndicatorProps) => {
  const getStatusColor = () => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      case "offline":
        return "bg-gray-400";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "online":
        return "Online";
      case "away":
        return "Away";
      case "offline":
        return lastSeen ? `Last seen ${lastSeen}` : "Offline";
      default:
        return "Unknown";
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div 
        className={cn(
          "w-2 h-2 rounded-full", 
          getStatusColor(),
          status === "online" && "animate-pulse"
        )} 
      />
      {showText && (
        <span className="text-xs text-muted-foreground">
          {getStatusText()}
        </span>
      )}
    </div>
  );
};

export default ConnectionStatusIndicator;
