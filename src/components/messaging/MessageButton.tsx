import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { useDirectConnect } from "@/hooks/useDirectConnect";
import { CONNECTION_STATUS } from "@/constants/connectionStatus";

interface MessageButtonProps {
  userId: string;
  userName: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}

const MessageButton: React.FC<MessageButtonProps> = ({
  userId,
  userName,
  variant = "outline",
  size = "sm",
  className
}) => {
  const { connectState } = useDirectConnect(userId);

  // Only show message button for accepted connections
  if (!connectState.isConnected) {
    return null;
  }

  return (
    <Button variant={variant} size={size} className={className} asChild>
      <Link to={`/messages/${userId}`}>
        <MessageSquare className="h-4 w-4 mr-2" />
        Message {userName}
      </Link>
    </Button>
  );
};

export default MessageButton;
