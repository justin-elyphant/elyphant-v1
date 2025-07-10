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
import { 
  GroupChat, 
  GroupMessage, 
  sendGroupMessage, 
  fetchGroupMessages, 
  subscribeToGroupMessages,
  getGroupMembers,
  GroupChatMember 
} from "@/services/groupChatService";
import { getGroupGiftProjects, GroupGiftProject } from "@/services/groupGiftService";
import GroupGiftProjectCard from "./GroupGiftProjectCard";

interface GroupChatInterfaceProps {
  groupChat: GroupChat;
  currentUserId: string;
  onCreateGiftProject?: (groupChatId: string) => void;
}

const GroupChatInterface = ({ groupChat, currentUserId, onCreateGiftProject }: GroupChatInterfaceProps) => {
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [members, setMembers] = useState<GroupChatMember[]>([]);
  const [giftProjects, setGiftProjects] = useState<GroupGiftProject[]>([]);
  const [showMembers, setShowMembers] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load messages, members, and gift projects
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [messagesData, membersData, projectsData] = await Promise.all([
          fetchGroupMessages(groupChat.id),
          getGroupMembers(groupChat.id),
          getGroupGiftProjects(groupChat.id)
        ]);
        
        setMessages(messagesData);
        setMembers(membersData);
        setGiftProjects(projectsData);
      } catch (error) {
        console.error('Error loading group data:', error);
        toast("Failed to load group data");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [groupChat.id, toast]);

  // Subscribe to new messages
  useEffect(() => {
    const unsubscribe = subscribeToGroupMessages(groupChat.id, (message) => {
      setMessages(prev => [...prev, message]);
    });

    return unsubscribe;
  }, [groupChat.id]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isLoading) return;

    const content = newMessage.trim();
    setNewMessage("");

    try {
      const message = await sendGroupMessage(groupChat.id, content);
      if (!message) {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast("Failed to send message");
      setNewMessage(content); // Restore message on error
    }
  };

  const getMemberById = (userId: string) => {
    return members.find(m => m.user_id === userId);
  };

  const getMessageSenderName = (message: GroupMessage) => {
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

      {/* Gift Projects Section */}
      {giftProjects.length > 0 && (
        <div className="p-4 border-b bg-muted/20">
          <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Active Gift Projects
          </h3>
          <div className="space-y-2">
            {giftProjects.map(project => (
              <GroupGiftProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      )}

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
          {messages.map((message) => {
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
          })}
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
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={!newMessage.trim() || isLoading}
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