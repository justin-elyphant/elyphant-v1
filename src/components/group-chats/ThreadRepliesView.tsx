import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { getThreadReplies, GroupMessage, GroupChatMember } from "@/services/groupChatService";

interface ThreadRepliesViewProps {
  parentMessageId: string;
  members: GroupChatMember[];
  currentUserId: string;
}

const ThreadRepliesView = ({ parentMessageId, members, currentUserId }: ThreadRepliesViewProps) => {
  const [replies, setReplies] = useState<GroupMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReplies = async () => {
      setLoading(true);
      try {
        const repliesData = await getThreadReplies(parentMessageId);
        setReplies(repliesData);
      } catch (error) {
        console.error('Error loading thread replies:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReplies();
  }, [parentMessageId]);

  const getSenderInfo = (senderId: string) => {
    const member = members.find(m => m.user_id === senderId);
    return {
      name: member?.profile?.name || 'Unknown User',
      avatar: member?.profile?.profile_image,
      initials: member?.profile?.name?.charAt(0) || '?'
    };
  };

  const formatMessageContent = (content: string) => {
    // Replace mention format with styled mentions
    return content.replace(/@\[([^\]]+)\]\([^)]+\)/g, '<span class="bg-blue-100 text-blue-800 px-1 rounded text-sm font-medium">@$1</span>');
  };

  if (loading) {
    return (
      <div className="ml-6 p-3 border-l-2 border-muted">
        <div className="text-xs text-muted-foreground">Loading replies...</div>
      </div>
    );
  }

  if (replies.length === 0) {
    return null;
  }

  return (
    <div className="ml-6 space-y-2 border-l-2 border-muted pl-3">
      {replies.map((reply, index) => {
        const isOwnMessage = reply.sender_id === currentUserId;
        const sender = getSenderInfo(reply.sender_id);
        
        return (
          <div key={reply.id} className="space-y-1">
            {index > 0 && <Separator className="my-2" />}
            
            <div className={cn("flex gap-2", isOwnMessage && "justify-end")}>
              {!isOwnMessage && (
                <Avatar className="h-6 w-6">
                  <AvatarImage src={sender.avatar} alt={sender.name} />
                  <AvatarFallback className="text-xs">{sender.initials}</AvatarFallback>
                </Avatar>
              )}
              
              <div className={cn("max-w-[85%] space-y-1", isOwnMessage && "text-right")}>
                {!isOwnMessage && (
                  <div className="text-xs text-muted-foreground font-medium">
                    {sender.name}
                  </div>
                )}
                
                <Card className={cn(
                  "text-xs",
                  isOwnMessage 
                    ? "bg-primary/80 text-primary-foreground" 
                    : "bg-muted/60"
                )}>
                  <CardContent className="p-2">
                    <div 
                      className="leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: formatMessageContent(reply.content) }}
                    />
                    <div className="text-xs opacity-70 mt-1">
                      {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {isOwnMessage && (
                <Avatar className="h-6 w-6">
                  <AvatarImage src={sender.avatar} alt="You" />
                  <AvatarFallback className="text-xs">You</AvatarFallback>
                </Avatar>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ThreadRepliesView;