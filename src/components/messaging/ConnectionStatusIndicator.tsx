
import React from "react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export interface ConnectionStatusIndicatorProps {
  status: "online" | "offline" | "away";
  lastSeen?: string;
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

const ConnectionStatusIndicator = ({ 
  status, 
  lastSeen, 
  className, 
  showText = false,
  size = "sm"
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
        if (lastSeen) {
          try {
            const lastSeenDate = new Date(lastSeen);
            return `Last seen ${formatDistanceToNow(lastSeenDate, { addSuffix: true })}`;
          } catch {
            return "Offline";
          }
        }
        return "Offline";
      default:
        return "Unknown";
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "w-2 h-2";
      case "md":
        return "w-3 h-3";
      case "lg":
        return "w-4 h-4";
      default:
        return "w-2 h-2";
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div 
        className={cn(
          "rounded-full", 
          getSizeClasses(),
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
