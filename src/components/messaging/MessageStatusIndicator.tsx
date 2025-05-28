
import React from "react";
import { Check, CheckCheck, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageStatusIndicatorProps {
  status: "sending" | "sent" | "delivered" | "read";
  className?: string;
}

const MessageStatusIndicator = ({ status, className }: MessageStatusIndicatorProps) => {
  const getStatusIcon = () => {
    switch (status) {
      case "sending":
        return <Clock className="h-3 w-3 text-muted-foreground animate-pulse" />;
      case "sent":
        return <Check className="h-3 w-3 text-muted-foreground" />;
      case "delivered":
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
      case "read":
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <div className={cn("flex items-center justify-end", className)}>
      {getStatusIcon()}
    </div>
  );
};

export default MessageStatusIndicator;
