import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Users, Gift } from "lucide-react";
interface GroupChat {
  id: string;
  name: string;
  description?: string;
  creator_id: string;
  chat_type: string;
  is_active: boolean;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  members?: { id: string; user_id: string; profile?: { name: string; profile_image?: string } }[];
  last_message?: {
    content: string;
    created_at: string;
    sender_name: string;
  };
}

interface GroupChatCardProps {
  groupChat: GroupChat;
  isActive?: boolean;
  onClick: () => void;
}

const GroupChatCard = ({ groupChat, isActive = false, onClick }: GroupChatCardProps) => {
  const memberCount = groupChat.members?.length || 0;
  const hasGiftProject = groupChat.chat_type === 'gift_project';

  const getGroupInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getChatTypeColor = (type: string) => {
    switch (type) {
      case 'gift_project':
        return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'family':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      case 'occasion':
        return 'bg-gradient-to-r from-orange-500 to-red-500';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-4 rounded-lg cursor-pointer hover:bg-muted/50 transition-all duration-200",
        isActive && "bg-muted border-l-4 border-primary"
      )}
      onClick={onClick}
    >
      <div className="relative">
        <Avatar className="h-12 w-12">
          <AvatarImage src={groupChat.avatar_url} alt={groupChat.name} />
          <AvatarFallback className={cn("text-white font-semibold", getChatTypeColor(groupChat.chat_type))}>
            {getGroupInitials(groupChat.name)}
          </AvatarFallback>
        </Avatar>
        {hasGiftProject && (
          <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
            <Gift className="h-3 w-3 text-primary-foreground" />
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm truncate">{groupChat.name}</h4>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{memberCount}</span>
            </div>
          </div>
          {groupChat.last_message && (
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(groupChat.last_message.created_at), { addSuffix: true })}
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          {groupChat.last_message ? (
            <p className="text-sm text-muted-foreground truncate flex-1">
              <span className="font-medium">{groupChat.last_message.sender_name}:</span>{' '}
              {groupChat.last_message.content}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground italic">No messages yet</p>
          )}
        </div>

        {groupChat.description && (
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {groupChat.description}
          </p>
        )}

        <div className="flex items-center gap-2 mt-2">
          <Badge 
            variant="secondary" 
            className="text-xs"
          >
            {groupChat.chat_type.replace('_', ' ')}
          </Badge>
          {hasGiftProject && (
            <Badge variant="outline" className="text-xs">
              <Gift className="h-3 w-3 mr-1" />
              Gift Project
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupChatCard;