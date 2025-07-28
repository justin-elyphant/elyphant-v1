import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Share2, MoreHorizontal } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { UnifiedMessage } from "@/services/UnifiedMessagingService";
import GiftProposalCard from "./GiftProposalCard";
import ThreadRepliesView from "./ThreadRepliesView";
import { SecureMessageContent } from "@/utils/secureMessageFormatter";

interface GroupChatMember {
  id: string;
  group_chat_id: string;
  user_id: string;
  role: string;
  can_invite: boolean;
  can_manage_gifts: boolean;
  joined_at: string;
  last_seen_at?: string;
  profile?: { name: string; profile_image?: string };
}

interface EnhancedGroupMessageProps {
  message: UnifiedMessage;
  members: GroupChatMember[];
  currentUserId: string;
  isOwnMessage: boolean;
  onReply?: (messageId: string) => void;
  onShare?: (message: UnifiedMessage) => void;
  onVoteUpdate?: () => void;
}

const EnhancedGroupMessage = ({
  message,
  members,
  currentUserId,
  isOwnMessage,
  onReply,
  onShare,
  onVoteUpdate
}: EnhancedGroupMessageProps) => {
  const [showReplies, setShowReplies] = useState(false);

  const getSenderName = () => {
    const member = members.find(m => m.user_id === message.sender_id);
    return member?.profile?.name || 'Unknown User';
  };

  const getSenderAvatar = () => {
    const member = members.find(m => m.user_id === message.sender_id);
    return member?.profile?.profile_image;
  };

  // formatMessageContent removed - now using SecureMessageContent component

  const replyCount = message.replies?.length || 0;
  const senderName = getSenderName();
  const senderInitials = senderName.charAt(0);

  // Handle different message types
  if (message.is_gift_proposal) {
    return (
      <div className={cn("flex gap-3", isOwnMessage && "justify-end")}>
        {!isOwnMessage && (
          <Avatar className="h-8 w-8">
            <AvatarImage src={getSenderAvatar()} alt={senderName} />
            <AvatarFallback className="text-xs">{senderInitials}</AvatarFallback>
          </Avatar>
        )}
        
        <div className={cn("max-w-[70%] space-y-2", isOwnMessage && "text-right")}>
          {!isOwnMessage && (
            <div className="text-xs text-muted-foreground font-medium">
              {senderName}
            </div>
          )}
          
          <GiftProposalCard
            message={message}
            currentUserId={currentUserId}
            onVoteUpdate={onVoteUpdate}
          />
        </div>

        {isOwnMessage && (
          <Avatar className="h-8 w-8">
            <AvatarImage src={getSenderAvatar()} alt="You" />
            <AvatarFallback className="text-xs">You</AvatarFallback>
          </Avatar>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex gap-3", isOwnMessage && "justify-end")}>
      {!isOwnMessage && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={getSenderAvatar()} alt={senderName} />
          <AvatarFallback className="text-xs">{senderInitials}</AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn("max-w-[70%] space-y-1", isOwnMessage && "text-right")}>
        {!isOwnMessage && (
          <div className="text-xs text-muted-foreground font-medium">
            {senderName}
          </div>
        )}
        
        <Card className={cn(
          "relative group",
          isOwnMessage 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted",
          message.message_type === 'product_share' && "border-2 border-green-200"
        )}>
          <CardContent className="p-3">
            {/* Product Share Display */}
            {message.message_type === 'product_share' && message.proposal_data && (
              <div className="mb-2 p-2 bg-background/10 rounded-lg">
                <div className="flex gap-2 items-center">
                  {message.proposal_data.product_image && (
                    <div className="w-12 h-12 bg-muted/20 rounded overflow-hidden">
                      <img 
                        src={message.proposal_data.product_image} 
                        alt={message.proposal_data.product_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs truncate">{message.proposal_data.product_name}</p>
                    <p className="text-sm font-bold">${message.proposal_data.product_price}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Message Content with Mentions - Secure Rendering */}
            <SecureMessageContent content={message.content} />
            
            {/* Message Actions */}
            <div className="flex items-center justify-between mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs"
                  onClick={() => onReply?.(message.id)}
                >
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Reply
                </Button>
                
                {replyCount > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs"
                    onClick={() => setShowReplies(!showReplies)}
                  >
                    {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs"
                  onClick={() => onShare?.(message)}
                >
                  <Share2 className="h-3 w-3" />
                </Button>
              </div>
              
              <span className="text-xs opacity-70">
                {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Thread Replies */}
        {showReplies && replyCount > 0 && (
          <ThreadRepliesView
            parentMessageId={message.id}
            members={members}
            currentUserId={currentUserId}
          />
        )}
      </div>

      {isOwnMessage && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={getSenderAvatar()} alt="You" />
          <AvatarFallback className="text-xs">You</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

export default EnhancedGroupMessage;