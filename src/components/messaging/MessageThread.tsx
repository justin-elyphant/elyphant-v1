
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface MessageThreadProps {
  threadId: string;
  connectionName: string;
  connectionImage?: string;
  connectionUsername?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isActive?: boolean;
  mutualFriends?: number;
  onClick: () => void;
}

const MessageThread = ({
  threadId,
  connectionName,
  connectionImage,
  connectionUsername,
  lastMessage,
  lastMessageTime,
  unreadCount,
  isActive = false,
  mutualFriends = 0,
  onClick
}: MessageThreadProps) => {
  const initials = connectionName
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors",
        isActive && "bg-muted"
      )}
      onClick={onClick}
    >
      <div className="relative">
        <Avatar className="h-10 w-10">
          <AvatarImage src={connectionImage} alt={connectionName} />
          <AvatarFallback className="bg-purple-100 text-purple-800 font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-medium text-sm truncate">{connectionName}</h4>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(lastMessageTime), { addSuffix: true })}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground truncate flex-1">{lastMessage}</p>
          {mutualFriends > 0 && (
            <span className="text-xs text-muted-foreground ml-2">
              {mutualFriends} mutual
            </span>
          )}
        </div>
        {connectionUsername && (
          <p className="text-xs text-muted-foreground mt-1">{connectionUsername}</p>
        )}
      </div>
      
      {unreadCount > 0 && (
        <Badge variant="default" className="bg-primary text-primary-foreground min-w-[20px] h-5 text-xs">
          {unreadCount}
        </Badge>
      )}
    </div>
  );
};

export default MessageThread;
