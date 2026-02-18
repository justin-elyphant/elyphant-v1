import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Send, Users, Settings, Gift, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useGroupMessaging } from "@/hooks/useUnifiedMessaging";
import type { UnifiedMessage } from "@/services/UnifiedMessagingService";
import { supabase } from "@/integrations/supabase/client";

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
  members?: GroupChatMember[];
}

interface GroupChatMember {
  id: string;
  user_id: string;
  role: string;
  can_invite: boolean;
  can_manage_gifts: boolean;
  joined_at: string;
  profile?: { name: string; profile_image?: string };
}

interface GroupChatInterfaceProps {
  groupChat: GroupChat;
  currentUserId: string;
  onCreateGiftProject?: (groupChatId: string) => void;
}

const GroupChatInterface = ({ groupChat, currentUserId, onCreateGiftProject }: GroupChatInterfaceProps) => {
  const [newMessage, setNewMessage] = useState("");
  const [members, setMembers] = useState<GroupChatMember[]>([]);
  const [showMembers, setShowMembers] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Use unified messaging hook
  const { 
    messages, 
    loading, 
    sendMessage, 
    markAsRead,
    isOnline
  } = useGroupMessaging(groupChat.id);

  // Load members and gift projects
  useEffect(() => {
    const loadData = async () => {
      try {
        const membersData = await getGroupMembers(groupChat.id);
        setMembers(membersData);
      } catch (error) {
        console.error('Error loading group data:', error);
        toast("Failed to load group data");
      }
    };

    loadData();
  }, [groupChat.id, toast]);

  // Helper function to get group members
  const getGroupMembers = async (groupChatId: string): Promise<GroupChatMember[]> => {
    try {
      const { data, error } = await supabase
        .from('group_chat_members')
        .select(`
          *,
          profile:profiles(name, profile_image)
        `)
        .eq('group_chat_id', groupChatId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching group members:', error);
      return [];
    }
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || loading) return;

    const content = newMessage.trim();
    setNewMessage("");

    try {
      await sendMessage({ content });
    } catch (error) {
      console.error('Error sending message:', error);
      toast("Failed to send message");
      setNewMessage(content); // Restore message on error
    }
  };

  const getMemberById = (userId: string) => {
    return members.find(m => m.user_id === userId);
  };

  const getMessageSenderName = (message: UnifiedMessage) => {
    const member = getMemberById(message.sender_id);
    return member?.profile?.name || 'Unknown User';
  };

  const isCurrentUserAdmin = () => {
    const currentMember = getMemberById(currentUserId);
    return currentMember?.role === 'admin';
  };

  const canManageGifts = () => {
    const currentMember = getMemberById(currentUserId);
    return currentMember?.can_manage_gifts || currentMember?.role === 'admin';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={groupChat.avatar_url} alt={groupChat.name} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {groupChat.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold">{groupChat.name}</h2>
            <p className="text-sm text-muted-foreground">
              {members.length} member{members.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {canManageGifts() && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCreateGiftProject?.(groupChat.id)}
            >
              <Gift className="h-4 w-4 mr-2" />
              New Gift Project
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMembers(!showMembers)}
          >
            <Users className="h-4 w-4 mr-2" />
            Members
          </Button>
          {isCurrentUserAdmin() && (
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Members Sidebar */}
      {showMembers && (
        <div className="p-4 border-b bg-muted/10">
          <h3 className="font-medium text-sm mb-3">Members</h3>
          <div className="grid grid-cols-2 gap-2">
            {members.map(member => (
              <div key={member.id} className="flex items-center gap-2 p-2 rounded-lg bg-background">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={member.profile?.profile_image} alt={member.profile?.name} />
                  <AvatarFallback className="text-xs">
                    {member.profile?.name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm truncate flex-1">{member.profile?.name}</span>
                {member.role === 'admin' && (
                  <Badge variant="secondary" className="text-xs">Admin</Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.sender_id === currentUserId;
              const senderName = getMessageSenderName(message);
              
              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    isOwnMessage && "justify-end"
                  )}
                >
                  {!isOwnMessage && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={getMemberById(message.sender_id)?.profile?.profile_image} alt={senderName} />
                      <AvatarFallback className="text-xs">
                        {senderName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={cn(
                    "max-w-[70%] space-y-1",
                    isOwnMessage && "text-right"
                  )}>
                    {!isOwnMessage && (
                      <div className="text-xs text-muted-foreground font-medium">
                        {senderName}
                      </div>
                    )}
                    
                    <div className={cn(
                      "rounded-lg px-3 py-2 text-sm",
                      isOwnMessage 
                        ? "bg-primary text-primary-foreground ml-auto" 
                        : "bg-muted"
                    )}>
                      {message.content}
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </div>
                  </div>

                  {isOwnMessage && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={getMemberById(message.sender_id)?.profile?.profile_image} alt="You" />
                      <AvatarFallback className="text-xs">
                        You
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <Separator />

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message ${groupChat.name}...`}
            disabled={loading}
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={!newMessage.trim() || loading}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default GroupChatInterface;