
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle } from "lucide-react";

interface MessageThreadProps {
  threadId: string;
  connectionName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isActive: boolean;
  onClick: () => void;
}

const MessageThread = ({
  connectionName,
  lastMessage,
  lastMessageTime,
  unreadCount,
  isActive,
  onClick
}: MessageThreadProps) => {
  return (
    <Card 
      className={`cursor-pointer transition-colors hover:bg-muted/50 ${
        isActive ? "border-primary bg-primary/5" : ""
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{connectionName}</CardTitle>
          {unreadCount > 0 && (
            <Badge variant="default" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground truncate mb-1">
          {lastMessage}
        </p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MessageCircle className="h-3 w-3" />
          {formatDistanceToNow(new Date(lastMessageTime), { addSuffix: true })}
        </div>
      </CardContent>
    </Card>
  );
};

export default MessageThread;
